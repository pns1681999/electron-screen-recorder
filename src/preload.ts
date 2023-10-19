// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AnalyzeSuccessArgs, IElectronAPI } from './renderer';

let mediaRecorder: MediaRecorder; // MediaRecorder instance to capture footage
let recordedChunks: Blob[] = [];

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

  getSources: async () => ipcRenderer.invoke('get-sources'),
  selectSource: (source: any) => ipcRenderer.invoke('select-source', source),
  startRecording: () => {
    ipcRenderer.send('start-record');
  },
  stopRecording: () => {
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
});

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
