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

const btnStart = document.getElementById('btnStart');

let state = 'idle';

const startButton = document.getElementById('btnStart');
if (state === 'ready') {
  startButton.innerHTML = 'Start';
  startButton.addEventListener('click', () => {
    console.log('start recording');
    window.api.startRecording();
    state = 'recording';
  });
} else if (state === 'recording') {
  startButton.innerHTML = 'Pause';
  startButton.addEventListener('click', () => {
    console.log('pause recording');
    window.api.pauseRecording();
    state = 'paused';
  });
} else if (state === 'paused') {
  startButton.innerHTML = 'Resume';
  startButton.addEventListener('click', () => {
    console.log('resume recording');
    window.api.resumeRecording();
    state = 'recording';
  });
} else {
  startButton.innerHTML = 'Select Source';
  startButton.addEventListener('click', async () => {
    // handle select source
    const sources: any = await window.api.getSources();

    // display sources on dialog box, allow user to select source
    // create dialog box
    const dialog = document.createElement('dialog');
    dialog.id = 'dialog';
    dialog.style.display = 'block';
    dialog.style.position = 'absolute';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = '400px';
    dialog.style.padding = '1rem';

    // create select element
    const select = document.createElement('select');
    select.id = 'select';
    select.style.width = '100%';
    select.style.padding = '0.5rem';
    select.style.marginBottom = '1rem';
    select.style.border = '1px solid #ccc';

    // create option elements
    const option = document.createElement('option');
    option.value = '';
    option.innerHTML = 'Select a source';
    select.appendChild(option);

    sources.forEach((source: any) => {
      const option = document.createElement('option');
      option.value = source.id;
      option.innerHTML = source.name;
      select.appendChild(option);
    });

    // create button elements
    const button = document.createElement('button');
    button.id = 'btnSelect';
    button.innerHTML = 'Select';
    // add elements to dialog box
    dialog.appendChild(select);
    dialog.appendChild(button);
    document.body.appendChild(dialog);

    // handle select button
    button.addEventListener('click', async () => {
      const sourceId = select.value;
      console.log('sourceId: ', sourceId);
      await window.api.selectSource(sourceId);
      dialog.remove();
      state = 'ready';
    });
  });
}
