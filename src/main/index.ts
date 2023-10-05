import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  dialog,
  screen,
} from 'electron';
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

app.setName('Yarikata');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const windows: Map<string, BorderWindow> = new Map();

const createBorderWindow = (display: Electron.Display) => {
  const borderWindow = new BorderWindow(display);
  windows.set('borderWindow', borderWindow);
};

const createActionWindow = (display: Electron.Display) => {
  const actionWindow = new ActionWindow(display);
  actionWindow.setParentWindow(windows.get('borderWindow'));
  windows.set('actionWindow', actionWindow);
};

const createDrawWindow = (display: Electron.Display) => {
  const drawWindow = new DrawWindow(display);
  windows.set('drawWindow', drawWindow);
};

const createMainWindow = () => {
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

const createWindows = (display: Electron.Display) => {
  createBorderWindow(display);
  createActionWindow(display);
  createDrawWindow(display);
};

const destroyRecordWindows = () => {
  const drawWindow = windows.get('drawWindow');
  const borderWindow = windows.get('borderWindow');
  const actionWindow = windows.get('actionWindow');
  drawWindow && drawWindow.destroy();
  borderWindow && borderWindow.destroy();
  actionWindow && actionWindow.destroy();
  windows.delete('drawWindow');
  windows.delete('borderWindow');
  windows.delete('actionWindow');
};

const handleSelectSource = async (event: any, source: any) => {
  const sourceWindow = windows.get('sourceWindow');
  // hide sourceWindow
  sourceWindow.hide();

  console.log(source);

  // TODO: How to move all windows to the display where the sourceId is located
  const allDisplays = screen.getAllDisplays();
  console.log(allDisplays);
  // we need to find the display where the sourceId is located
  const display = allDisplays.find(
    (display) => display.id.toString() === source.display_id.toString()
  );

  // create windows for recording
  createWindows(display);
  // send event to renderers
  const actionWindow = windows.get('actionWindow');
  actionWindow.webContents.send('sourceId-selected', source.id);
};

const handleGetSources = async () => {
  try {
    console.log('get-sources from main');
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
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

const exitRecord = () => {
  const sourceWindow = windows.get('sourceWindow');
  sourceWindow.show();
  destroyRecordWindows();
};

const handleSave = async (event: any, buffer: any) => {
  exitRecord();
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

const handleStartRecord = () => {
  const borderWindow = windows.get('borderWindow');
  borderWindow.webContents.send('start-record');
};
const handlePauseRecord = () => {
  const borderWindow = windows.get('borderWindow');
  borderWindow.webContents.send('pause-record');
};
const handleResumeRecord = () => {
  const borderWindow = windows.get('borderWindow');
  borderWindow.webContents.send('resume-record');
};

const handleStartRecordAfterCountdown = () => {
  const actionWindow = windows.get('actionWindow');
  actionWindow.webContents.send('start-record-after-countdown');
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createMainWindow();

  ipcMain.handle('get-sources', handleGetSources);
  ipcMain.handle('select-source', handleSelectSource);
  ipcMain.on('save-video', handleSave);
  ipcMain.on('exit-record', exitRecord);
  ipcMain.on('toggle-draw', toggleDrawWindow);
  ipcMain.on('start-record', handleStartRecord);
  ipcMain.on('pause-record', handlePauseRecord);
  ipcMain.on('resume-record', handleResumeRecord);
  ipcMain.on('start-record-after-countdown', handleStartRecordAfterCountdown);
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
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
