import { app, BrowserWindow, ipcMain, desktopCapturer, dialog } from 'electron';
import { writeFile } from 'fs/promises';

import {
  ActionWindow,
  BorderWindow,
  DrawWindow,
  SourceWindow,
} from './windows';

// Command line
// https://github.com/electron/electron/issues/19880#issuecomment-618222048
// app.commandLine.appendSwitch('disable-features', 'IOSurfaceCapturer');
app.commandLine.appendSwitch('enable-features', 'ScreenCaptureKitMac');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const windows = new Map();

const createBorderWindow = () => {
  // Check if the borderWindow is already open do not create a new one
  if (windows.has('borderWindow')) {
    return;
  }
  const borderWindow = new BorderWindow();
  windows.set('borderWindow', borderWindow);
};

const createActionWindow = () => {
  // Check if the borderWindow is already open do not create a new one
  if (windows.has('actionWindow')) {
    return;
  }
  const actionWindow = new ActionWindow();
  actionWindow.setParentWindow(windows.get('borderWindow'));
  windows.set('actionWindow', actionWindow);
};

const createDrawWindow = () => {
  // Check if the borderWindow is already open do not create a new one
  if (windows.has('drawWindow')) {
    return;
  }
  const drawWindow = new DrawWindow();
  windows.set('drawWindow', drawWindow);
};

const createMainWindow = () => {
  if (windows.has('sourceWindow')) {
    return;
  }
  const window = new SourceWindow();
  window.setParentWindow(windows.get('borderWindow'));
  windows.set('sourceWindow', window);
};

const toggleDrawWindow = () => {
  // Toggle drawWindow
  const borderWindow = windows.get('borderWindow');
  const actionWindow = windows.get('actionWindow');
  const drawWindow = windows.get('drawWindow');
  if (windows.has('drawWindow')) {
    if (drawWindow.isVisible()) {
      borderWindow.setParentWindow(null);
      actionWindow.setParentWindow(null);
      drawWindow.hide();
      actionWindow.setParentWindow(borderWindow);
      //Send message to drawWindow to clear canvas
      drawWindow.webContents.send('clear-canvas');
    } else {
      drawWindow.show();
      borderWindow.setParentWindow(drawWindow);
    }
  }
};

const handleSelectSource = async (event: any, sourceId: any) => {
  const sourceWindow = windows.get('sourceWindow');
  // close sourceWindow
  sourceWindow.close();

  // send sourceId to actionWindow
  const actionWindow = windows.get('actionWindow');
  actionWindow.webContents.send('sourceId-selected', sourceId);
};

const handleGetSources = async () => {
  try {
    console.log('get-sources from main');
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
    });
    // convert thumbnail to base64
    sources.forEach((source: any) => {
      const isThumbnailEmpty = source.thumbnail.isEmpty();
      if (isThumbnailEmpty) {
        source.thumbnail = null;
        return;
      }
      source.thumbnail = source.thumbnail?.toDataURL();
    });
    return sources;
  } catch (error) {
    console.log('error', error);
    return [];
  }
};

const handleSave = async (event: any, buffer: any) => {

  console.log('save-video from main');
  const { canceled, filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`,
  });


  if (canceled) {
    console.log('user canceled save video');
    return;
  }

  console.log('save video to', filePath);

  await writeFile(filePath, buffer);
  console.log('video saved successfully!');
  return filePath;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createBorderWindow();
  createActionWindow();
  createDrawWindow();
  createMainWindow();

  //Handle ipcMain events

  ipcMain.handle('get-sources', handleGetSources);
  ipcMain.handle('select-source', handleSelectSource);
  ipcMain.handle('save-video', handleSave);

  //Handle ipcMain events
  ipcMain.on('toggle-draw', () => {
    toggleDrawWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createBorderWindow();
    createActionWindow();
    createDrawWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
