import { BrowserWindow } from 'electron';
import path from 'path';
// Define class DrawWindow extends from BrowserWindow

export default class Window extends BrowserWindow {
  constructor() {
    super({
      maximizable: true,
      // display window at bottom left corner
      x: 0,
      y: 0,
      hasShadow: false,
      //Make the window larger than the screen (outside the dock bar)
      enableLargerThanScreen: true,
      movable: true,
      resizable: true,
      //In Windows, the taskbar will not show the icon of the window
      skipTaskbar: false,
      //Make frameless window (without title bar and border)
      // frame: false,
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
    this.maximize();
    //ActionWindow can be dragged

    //Set on top with level screen-saver(101) higher level dock-window(20) and higher BorderWindow and DrawWindow
    // Open the DevTools.
    // this.webContents.openDevTools({ mode: 'detach' });
  }
}
