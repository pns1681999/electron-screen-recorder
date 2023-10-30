import {
  BrowserWindow,
  IpcMainEvent,
  Menu,
  app,
  desktopCapturer,
  dialog,
  ipcMain,
  screen,
} from 'electron';
// import { unlink, writeFile } from 'fs';
// const ffmpeg = require('fluent-ffmpeg');
import { readFile, writeFile } from 'fs/promises';

import { EdgeImpulseClassifier } from '../packages/edge-impulse';

import path from 'path';

import {
  ActionWindow,
  BorderWindow,
  DrawWindow,
  SourceWindow,
} from './windows';

import { handleSelectVideoToAnalyze } from './analyze-main';
// TODO: Configure menu
import {
  addSilentAudio,
  buildMergeVideoCommand,
  removeFiles,
  createTaskConvertVideoFile,
  getVideoInfo,
} from '../lib/ffmpeg';
import customMenu from '../menus/custom-menu';
import { EdgeImpulsePostProcessor } from '../utils/edge-impulse-post-processor';

Menu.setApplicationMenu(customMenu);

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
  const sourceWindow = windows.get('sourceWindow');
  const actionWindow = windows.get('actionWindow');
  if (actionWindow) {
    return;
  }
  if (sourceWindow) {
    sourceWindow.show();
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
      drawWindow.webContents.send('clear-canvas');
      drawWindow.hide();
      actionWindow.setParentWindow(borderWindow);
      //Send message to drawWindow to clear canvas
    } else {
      drawWindow.show();
      borderWindow.setParentWindow(drawWindow);
    }
  }
};

const createRecordingWindows = (display: Electron.Display) => {
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
  createRecordingWindows(display);
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

const handleSave = async (event: any, buffer: any, convert = true) => {
  exitRecord();
  const { canceled, filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.${convert ? 'mp4' : 'webm'}`,
  });

  if (canceled) {
    console.log('user canceled save video');
    return;
  }

  console.log('save video to', filePath);
  if (convert) {
    const sendMessageSourceWindow = (message: any) => {
      const sourceWindow = windows.get('sourceWindow');
      sourceWindow.webContents.send('save-video-status', message);
    };

    const ffmpegTask = createTaskConvertVideoFile(buffer, filePath);
    await ffmpegTask
      .on('start', (commandLine: string) => {
        console.log('👉 Waiting:::', commandLine);
        sendMessageSourceWindow({
          label: 'Waiting',
          value: 0,
          message: 'Waiting...',
          commandLine,
        });
      })
      .on('progress', (progress: Record<string, any>) => {
        console.log('👉 Progress:::', progress);
        // convert timemark to seconds
        sendMessageSourceWindow({
          label: 'Progress',
          value: progress,
          message: 'Saving...',
          commandLine: '',
        });
      })
      .on('error', (err: Record<string, any>) => {
        console.log('👉 ERROR:::', err.message);
        sendMessageSourceWindow({
          label: 'Error',
          value: 0,
          message: err.message,
          commandLine: '',
        });
      })
      .on('end', () => {
        // progressBar.value = 100;
        console.log('👉 DONE !!!!');
        sendMessageSourceWindow({
          label: 'Success',
          value: 100,
          message: 'Success',
          commandLine: '',
        });
      })
      .run();
  } else {
    console.log('write file');
    writeFile(filePath, buffer);
  }

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

const edgeInpulseClassifier = new EdgeImpulseClassifier();
edgeInpulseClassifier.init();

const edgeImpulsePostProcessor = new EdgeImpulsePostProcessor();

const handleAudioClassifier = (_: IpcMainEvent, rawData: Int16Array) => {
  const { results } = edgeInpulseClassifier.classifyContinuous(rawData) as {
    anomaly: any;
    results: { label: string; value: number }[];
  };

  const voiceCommand =
    edgeImpulsePostProcessor.processResultsContinuousSync(results);

  if (voiceCommand != null) {
    const actionWindow = windows.get('actionWindow');
    actionWindow.webContents.send('voice-command-detected', voiceCommand);
  }
};

const handleSelectVideoToMerge = async () => {
  // show dialog to select video
  console.log('select video to merge');
  const dialogFileType = { name: 'Videos', extensions: ['mp4', 'mov', 'webm'] };
  const response = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    message: 'Select Video File to load',
    filters: [dialogFileType],
  });

  if (response.canceled || response.filePaths.length <= 0) {
    return [];
  }

  const selectedFilePaths = response.filePaths;
  const promises = selectedFilePaths.map(async (filePath) => {
    const thumbnailPath = path.join(__dirname, 'assets/images/video.png');
    // read file and build thumbnail base64
    const thumbnail = await readFile(thumbnailPath, { encoding: 'base64' });
    return {
      filePath,
      name: path.basename(filePath),
      // build thumbnail base64
      thumbnail: `data:image/png;base64,${thumbnail}`,
    };
  });

  const results = await Promise.all(promises);
  return results;
};

const handleSelectPathToSaveFile = async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `merge-vid-${Date.now()}.mp4`,
  });

  return {
    canceled,
    filePath,
  };
};

const handleMergeVideos = async (
  event: any,
  videoPaths: string[],
  filePath: string
) => {
  console.log('merge videos', videoPaths, filePath);

  // get total duration of videos
  const promises = videoPaths.map((videoPath) => getVideoInfo(videoPath));
  const videoInfos = await Promise.all(promises);
  // console.log('video infos', videoInfos);
  const totalDuration = videoInfos.reduce((acc, videoInfo: any) => {
    // huhm, in case webm. It could not detect duration
    const duration =
      videoInfo.format.duration === 'N/A' ? 0 : videoInfo.format.duration;
    return acc + duration;
  }, 0);

  console.log('total duration', totalDuration);

  const sourceWindow = windows.get('sourceWindow');

  const [newSources, tempFilePaths] = await addSilentAudio({
    sources: videoPaths,
    videoInfos,
  });

  const ffmpeg = await buildMergeVideoCommand({
    sources: newSources,
    filePath,
    fileType: 'mp4',
  });

  console.log('🫵🫵🫵:', newSources);

  ffmpeg
    .on('start', (commandLine: string) => {
      console.log('👉 CMD:::', commandLine);
      sourceWindow.webContents.send('merging-video', {
        label: 'Waiting',
        value: 0,
        message: 'Waiting...',
        commandLine,
        totalDuration,
      });
    })
    .on('progress', (progress: Record<string, any>) => {
      console.log('👉 Progress:::', progress);
      const timemark = progress.timemark;
      // convert timemark to seconds
      const timeParts = timemark.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const seconds = parseInt(timeParts[2]);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      sourceWindow.webContents.send('merging-video', {
        label: 'Progress',
        value: totalSeconds,
        message: 'Merging...',
        commandLine: '',
        totalDuration,
      });
    })
    .on('error', (err: Record<string, any>) => {
      console.log('👉 ERROR:::', err.message);
      ffmpeg.kill();
      sourceWindow.webContents.send('merging-video', {
        label: 'Error',
        value: 0,
        message: err.message,
        commandLine: '',
      });
    })
    .on('end', () => {
      // progressBar.value = 100;
      ffmpeg.kill();
      console.log('👉 DONE !!!!');
      removeFiles(tempFilePaths);
      sourceWindow.webContents.send('merging-video', {
        label: 'Success',
        value: 100,
        message: 'Success',
        commandLine: '',
        filePath,
      });
    })
    .save(filePath);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createMainWindow();

  ipcMain.handle('get-sources', handleGetSources);
  ipcMain.handle('select-source', handleSelectSource);
  ipcMain.handle('save-video', handleSave);
  ipcMain.on('exit-record', exitRecord);
  ipcMain.on('toggle-draw', toggleDrawWindow);
  ipcMain.on('start-record', handleStartRecord);
  ipcMain.on('pause-record', handlePauseRecord);
  ipcMain.on('resume-record', handleResumeRecord);
  ipcMain.on('start-record-after-countdown', handleStartRecordAfterCountdown);
  ipcMain.on('classify-audio', handleAudioClassifier);

  // Merge video
  ipcMain.handle('select-video-to-merge', handleSelectVideoToMerge);
  ipcMain.handle('merge-select-path-to-save-file', handleSelectPathToSaveFile);
  ipcMain.handle('merge-videos', handleMergeVideos);

  // * Analyze video
  ipcMain.on('select-video-to-analyze', handleSelectVideoToAnalyze);
});

if (process.platform === 'darwin') {
  (global as any).isMac = true;
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  windows.clear();
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
