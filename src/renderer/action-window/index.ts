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

import './index.css';

const toggleDrawBtn = document.getElementById('draw');
toggleDrawBtn.addEventListener('click', () => {
  console.log('object');
  window.api.toggleDraw();
});
console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite'
);

let state = 'idle';
const startButton = document.getElementById('btnStart');
const pauseButton = document.getElementById('btnPause');

window.api.onSourceWindowReady(() => {
  console.log('source window ready');
  state = 'ready';
});

startButton.addEventListener('click', () => {
  console.log('state', state);
  if (state === 'idle') {
    console.log('select source');
  } else if (state === 'ready') {
    console.log('start recording');
    window.api.startRecording();
    state = 'recording';
    startButton.innerHTML = 'Stop';
  } else if (state === 'recording') {
    window.api.stopRecording();
    console.log('stop recording');
    state = 'idle';
  }
});

pauseButton.addEventListener('click', () => {
  if (state === 'recording') {
    window.api.pauseRecording();
    state = 'paused';
    pauseButton.innerHTML = 'Resume';
  } else if (state === 'paused') {
    window.api.resumeRecording();
    state = 'recording';
    pauseButton.innerHTML = 'Pause';
  }
});
