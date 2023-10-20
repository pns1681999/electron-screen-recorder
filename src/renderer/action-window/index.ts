/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import { VoiceCommand } from 'src/utils/edge-impulse-post-processor';
import './index.css';

let isDrawing = false;
const toggleDrawBtn = document.getElementById('draw');
const drawLabel = document.getElementById('drawLabel');
toggleDrawBtn.addEventListener('click', () => {
  isDrawing = !isDrawing;
  if (isDrawing) {
    toggleDrawBtn.classList.remove('icon-[ic--baseline-draw]');
    toggleDrawBtn.classList.add('icon-[ic--baseline-block]');
    drawLabel.innerHTML = 'Stop drawing';
  } else {
    toggleDrawBtn.classList.remove('icon-[ic--baseline-block]');
    toggleDrawBtn.classList.add('icon-[ic--baseline-draw]');
    drawLabel.innerHTML = 'Start drawing';
  }
  window.api.toggleDraw();
});

type RecordingState = 'idle' | 'ready' | 'recording' | 'paused';
let state: RecordingState = 'ready';

const startButton = document.getElementById('btnStart');
const startLabel = document.getElementById('startLabel');
const stopButton = document.getElementById('btnStop');

startButton.addEventListener('click', () => {
  console.log('state', state);
  if (state === 'idle') {
    console.log('select source');
  } else if (state === 'ready' || state === 'paused') {
    startOrResumeRecording();
  } else if (state === 'recording') {
    pauseRecording();
  }
});
stopButton.addEventListener('click', () => {
  window.api.stopRecording();
  if (state !== 'ready') {
    state = 'idle';
  }
});

const startOrResumeRecording = () => {
  if (state === 'ready') {
    window.api.startRecording();
  } else if (state === 'paused') {
    window.api.resumeRecording();
    state = 'recording';
    startButton.classList.remove('icon-[ic--baseline-play-circle]');
    startButton.classList.add('icon-[ic--baseline-pause-circle]');
    startLabel.innerHTML = 'Pause recording';
  }
};

const pauseRecording = () => {
  if (state === 'recording') {
    window.api.pauseRecording();
    state = 'paused';
    startButton.classList.remove('icon-[ic--baseline-pause-circle]');
    startButton.classList.add('icon-[ic--baseline-play-circle]');
    startLabel.innerHTML = 'Resume recording';
  }
};

window.api.onStartRecordAfterCountdown(() => {
  state = 'recording';
  startButton.classList.remove('icon-[ic--baseline-circle]');
  startButton.classList.add('icon-[ic--baseline-pause-circle]');
  startLabel.innerHTML = 'Pause recording';
});

window.api.onVoiceCommandDetected((voiceCommand: VoiceCommand) => {
  switch (voiceCommand) {
    case 'start': {
      if (state === 'ready' || state === 'paused') {
        startOrResumeRecording();
      }
      break;
    }
    case 'stop': {
      if (state === 'recording') {
        pauseRecording();
      }
      break;
    }
  }
});
