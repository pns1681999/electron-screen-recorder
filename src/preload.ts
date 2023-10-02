// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

let mediaRecorder: MediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks: Blob[] = [];

contextBridge.exposeInMainWorld('api', {
  toggleDraw: () => ipcRenderer.send('toggle-draw'),
  onClearCanvas: (callback: () => void) =>
    ipcRenderer.on('clear-canvas', callback),

  getSources: async () => ipcRenderer.invoke('get-sources'),
  selectSource: (sourceId: string) =>
    ipcRenderer.invoke('select-source', sourceId),
  startRecording: () => mediaRecorder.start(),
  stopRecording: () => mediaRecorder.stop(),
  pauseRecording: () => mediaRecorder.pause(),
  resumeRecording: () => mediaRecorder.resume(),
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

  onSourceWindowReady: (callback: () => void) => {
    ipcRenderer.on('sourceId-selected', callback);
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
  ipcRenderer.invoke('save-video', buffer);
};

const handleStream = (stream: MediaStream) => {
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

const handleError = (e: Error) => {
  console.log('Stream error: ', e);
};

const handleSelectSource = async (sourceId: string) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
      },
    });

    handleStream(stream);
  } catch (error) {
    handleError(error);
  }
};

ipcRenderer.on('sourceId-selected', (event, sourceId) => {
  handleSelectSource(sourceId);
});
