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
import { Modal } from 'flowbite';

// countdown
class Countdown {
  private timer: any;
  private seconds: number;
  private updateStatus: (seconds: number) => void;
  private counterEnd: () => void;

  constructor(
    private element: HTMLElement,
    { seconds, onUpdateStatus, onCounterEnd }: any
  ) {
    element.textContent = seconds.toString();
    this.seconds = seconds;
    this.updateStatus = onUpdateStatus;
    this.counterEnd = onCounterEnd;
  }

  start() {
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  stop() {
    clearInterval(this.timer);
  }

  updateTimer() {
    this.seconds -= 1;
    this.updateStatus(this.seconds);
    if (this.seconds === 0) {
      this.stop();
      this.counterEnd();
    }
  }
}

const startCountdown = () => {
  const countNumberEle = document.getElementById('count-down-number');
  const countdown = new Countdown(countNumberEle, {
    seconds: 3,
    onUpdateStatus: (seconds: number) => {
      countNumberEle.textContent = seconds.toString();
    },
    onCounterEnd: () => {
      console.log('countdown ended');
      countdownModal.hide();
      window.api.startAfterCountdown();
      body.classList.remove('border-blue-800');
      body.classList.add('border-red-800');
    },
  });
  countdown.start();

  // build modal content
  const $modalElm: HTMLElement = document.querySelector('#count-down-modal');

  // show modal
  const countdownModal = new Modal($modalElm);
  countdownModal.show();
};

const body = document.querySelector('body');

window.api.onStartRecord(() => {
  startCountdown();
});

window.api.onPauseRecord(() => {
  body.classList.remove('border-red-800');
  body.classList.add('border-blue-800');
});
window.api.onResumeRecord(() => {
  body.classList.remove('border-blue-800');
  body.classList.add('border-red-800');
});
