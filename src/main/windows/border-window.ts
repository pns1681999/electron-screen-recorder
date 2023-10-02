import { BrowserWindow, screen } from 'electron';
import path from 'path';
// Define class BorderWindow extends from BrowserWindow
export default class BorderWindow extends BrowserWindow {
  constructor() {
    // Get the width and height of the primary display
    const { width, height } = screen.getPrimaryDisplay().bounds;
    super({
      width,
      height,
      x: 0,
      y: 0,
      hasShadow: false,
      //Make the window larger than the screen (outside the dock bar)
      enableLargerThanScreen: true,
      resizable: false,
      movable: false,
      //In Windows, the taskbar will not show the icon of the window
      skipTaskbar: true,
      //Make frameless window (without title bar and border)
      frame: false,
      //Make the window transparent
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/borderWindow.html`);
    } else {
      this.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/borderWindow.html`
        )
      );
    }
    //Set on top with level screen-saver(101)
    this.setAlwaysOnTop(true, 'screen-saver');
    //Set ignore mouse event
    this.setIgnoreMouseEvents(true);
    //If device not MacOs, set fullscreen to hide the taskbar
    if (process.platform !== 'darwin') {
      this.setFullScreen(true);
    }
    // Open the DevTools.
    // this.webContents.openDevTools({ mode: 'detach' });
  }
}
