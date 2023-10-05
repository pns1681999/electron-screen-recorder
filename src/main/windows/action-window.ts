import { BrowserWindow } from 'electron';
import path from 'path';
// Define class DrawWindow extends from BrowserWindow
export default class DrawWindow extends BrowserWindow {
  constructor(display: Electron.Display) {
    // Get the width and height of the primary display
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width, height } = display.bounds;
    super({
      width: 340,
      height: 80,
      x: display.bounds.x,
      y: display.bounds.y,
      hasShadow: false,
      //Make the window larger than the screen (outside the dock bar)
      enableLargerThanScreen: true,
      resizable: false,
      movable: true,
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
      this.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/actionWindow.html`);
    } else {
      this.loadFile(
        path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/actionWindow.html`
        )
      );
    }
    //ActionWindow can be dragged

    //Set on top with level screen-saver(101) higher level dock-window(20) and higher BorderWindow and DrawWindow
    this.setAlwaysOnTop(true, 'screen-saver');
    // Open the DevTools.
    this.webContents.openDevTools({ mode: 'detach' });

    this.setContentProtection(true);
  }
}
