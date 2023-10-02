import {
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  dialog,
  screen,
} from 'electron';
import path from 'path';
import { writeFile } from 'fs/promises';
// Define class DrawWindow extends from BrowserWindow

export default class Window extends BrowserWindow {
  constructor() {
    // Get the width and height of the primary display
    const mainScreen = screen.getPrimaryDisplay();
    const w = 450;
    const h = 400;
    super({
      width: w,
      height: h,
      // display window at bottom left corner
      x: mainScreen.size.width/2 - w,
      y: mainScreen.size.height/2 - h,
      hasShadow: false,
      //Make the window larger than the screen (outside the dock bar)
      enableLargerThanScreen: true,
      movable: true,
      resizable: false,
      //In Windows, the taskbar will not show the icon of the window
      skipTaskbar: true,
      //Make frameless window (without title bar and border)
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/sourceWindow.html`);
    } else {
      this.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/sourceWindow.html`
        )
      );
    }
    //ActionWindow can be dragged

    //Set on top with level screen-saver(101) higher level dock-window(20) and higher BorderWindow and DrawWindow
    this.setAlwaysOnTop(true, 'screen-saver');
    // Open the DevTools.
    // this.webContents.openDevTools({ mode: 'detach' });
  }

}
