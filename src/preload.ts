// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AnalyzeSuccessArgs, IElectronAPI } from './renderer';

import {
  MediaRecorder as ExtendableMediaRecorder,
  IMediaRecorder,
  register as registerEncoder,
} from 'extendable-media-recorder';
import { connect as connectWavEncoder } from 'extendable-media-recorder-wav-encoder';
import { VoiceCommand } from './utils/edge-impulse-post-processor';

let mediaRecorder: MediaRecorder; // MediaRecorder instance to capture footage
let recordedChunks: Blob[] = [];

let voiceCommandRecorder: IMediaRecorder;

contextBridge.exposeInMainWorld('api', {
  toggleDraw: () => ipcRenderer.send('toggle-draw'),
  startAfterCountdown: () => ipcRenderer.send('start-record-after-countdown'),
  onClearCanvas: (callback: () => void) =>
    ipcRenderer.on('clear-canvas', callback),

  onStartRecord: (callback: () => void) =>
    ipcRenderer.on('start-record', callback),
  onStartRecordAfterCountdown: (callback: () => void) =>
    ipcRenderer.on('start-record-after-countdown', callback),
  onPauseRecord: (callback: () => void) =>
    ipcRenderer.on('pause-record', callback),
  onResumeRecord: (callback: () => void) =>
    ipcRenderer.on('resume-record', callback),

  onVoiceCommandDetected: (callback: (voiceCommand: VoiceCommand) => void) =>
    ipcRenderer.on('voice-command-detected', (_, voiceCommand) =>
      callback(voiceCommand)
    ),

  getSources: async () => ipcRenderer.invoke('get-sources'),
  selectSource: (source: any) => ipcRenderer.invoke('select-source', source),
  startRecording: () => {
    ipcRenderer.send('start-record');
  },
  stopRecording: () => {
    voiceCommandRecorder.stop();

    if (mediaRecorder.state === 'inactive') {
      ipcRenderer.send('exit-record');
    } else {
      mediaRecorder.stop();
      ipcRenderer.send('start-record');
    }
  },
  pauseRecording: () => {
    mediaRecorder.pause();
    ipcRenderer.send('pause-record');
  },
  resumeRecording: () => {
    mediaRecorder.resume();
    ipcRenderer.send('resume-record');
  },
  toggleRecording: () => {
    console.log('MediaRecorder.state: ', mediaRecorder.state);
    if (mediaRecorder.state === 'recording') {
      console.log('pause recording');
      mediaRecorder.pause();
      // recording paused
    } else if (mediaRecorder.state === 'paused') {
      console.log('resume recording');
      mediaRecorder.resume();
      // resume recording
    } else {
      console.log('start recording');
      mediaRecorder.start();
      // start recording
    }
    return mediaRecorder.state;
  },

  onSaveVideo: (callback: (args: any) => void) => {
    ipcRenderer.on('save-video-status', (_, args) => callback(args));
  },

  // * Analyze video
  selectVideoToAnalyze: () => {
    ipcRenderer.send('select-video-to-analyze');
  },
  onAnalyzeSuccess: (callback: (args: AnalyzeSuccessArgs) => void) => {
    ipcRenderer.on('analyze-success', (_, args) => callback(args));
  },

  // * Merge video
  selectVideoToMerge: () => ipcRenderer.invoke('select-video-to-merge'),
  selectPathToSaveFile: () =>
    ipcRenderer.invoke('merge-select-path-to-save-file'),
  mergeVideos: (videoPaths: string[], filePath: string) =>
    ipcRenderer.invoke('merge-videos', videoPaths, filePath),
  onMergingVideo: (callback: (args: any) => void) => {
    ipcRenderer.on('merging-video', (_, args) => callback(args));
  },
} satisfies IElectronAPI);

const handleDataAvailable = (e: BlobEvent) => {
  recordedChunks.push(e.data);
  console.log('video data available', recordedChunks.length);
};

const handleStop = async () => {
  console.log('mediaRecorder stopped');
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9',
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  console.log('buffer', buffer);
  mediaRecorder = null;
  recordedChunks = [];

  voiceCommandRecorder = null;

  // TODO enable convert to mp4
  const convertToMp4 = true;

  const res = await ipcRenderer.invoke('save-video', buffer, convertToMp4);
  console.log('result:', res);
};

const handleStream = (videoStream: MediaStream, audioStream: MediaStream) => {
  const [videoTrack] = videoStream.getVideoTracks();
  const [audioTrack] = audioStream.getAudioTracks();
  const combinedStream = new MediaStream([videoTrack, audioTrack]);

  mediaRecorder = new MediaRecorder(combinedStream, {
    // https://www.webrtc-experiment.com/RecordRTC/simple-demos/isTypeSupported.html
    mimeType: 'video/webm; codecs=vp9',
  });

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  initVoiceCommandRecorder(audioStream);
};

const initVoiceCommandRecorder = async (audioStream: MediaStream) => {
  // Required to use `{ mimeType: 'audio/wav' }`
  await registerEncoder(await connectWavEncoder());

  // Downsample the audio stream to 16kHz sample rate - 1 channel PCM
  // which is required for EdgeImpulse to classify

  const audioContext = new AudioContext({ sampleRate: 16000 });

  const mediaStreamAudioSourceNode =
    audioContext.createMediaStreamSource(audioStream);

  const mediaStreamAudioDestinationNode =
    audioContext.createMediaStreamDestination();
  mediaStreamAudioDestinationNode.channelCount = 1;

  mediaStreamAudioSourceNode.connect(mediaStreamAudioDestinationNode);

  voiceCommandRecorder = new ExtendableMediaRecorder(
    mediaStreamAudioDestinationNode.stream,
    // Wav PCM is required for EdgeImpulse to process
    { mimeType: 'audio/wav' }
  );

  voiceCommandRecorder.ondataavailable = async (blobEvent) => {
    const rawData = new Int16Array(await blobEvent.data.arrayBuffer());
    ipcRenderer.send('classify-audio', rawData);
  };

  // ! EdgeImpulse post-process configs should be adjusted based on this timeslice value
  voiceCommandRecorder.start(100);
};

const handleError = (e: Error) => {
  console.log('Stream error: ', e);
};

const handleSelectSource = async (sourceId: string) => {
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
      } as any, // Suppress lint error
    });

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        sampleSize: 16,
      },
      video: false,
    });

    handleStream(videoStream, audioStream);
  } catch (error) {
    handleError(error);
  }
};

ipcRenderer.on('sourceId-selected', (event, sourceId) => {
  handleSelectSource(sourceId);
});

ipcRenderer.on('start-record-after-countdown', () => {
  mediaRecorder.start();
});
