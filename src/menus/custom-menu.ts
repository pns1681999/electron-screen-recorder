
import { dialog, Menu, Notification } from "electron";
// import ProgressBar from "electron-progressbar";
const colors = require('colors')

// const path = require("path");
import { ffmpeg, VIDEO_FILTER, VIDEO_OPTIONS } from "../lib";

const dialogFileType = { name: "Videos", extensions: ["mp4", "mov", 'webm'] };

const dialogOptions = {
  properties: ["openFile", "multiSelections"],
  message: "Select Video File to load",
  filters: [dialogFileType],
};

// let selectedFilePath;
let selectedFilePaths: string[] = [];

// for checking is user is on a mac
// const isMac = process.platform === 'darwin'

const myMenuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Video",
        submenu: [
          {
            label: "Load video",
            click(e, dialogWindow) {
              dialog
                .showOpenDialog(dialogWindow, dialogOptions)
                .then((response) => {
                  if (response.filePaths.length) {
                    // selectedFilePath = response.filePaths[0];
                    selectedFilePaths = response.filePaths;
                    // send file path to renderer
                    // open file in window
                    // dialogWindow.webContents.send("filePath", { filePath: selectedFilePath });
                    Menu.getApplicationMenu().getMenuItemById("mp4").enabled =
                      true;
                    // Menu.getApplicationMenu().getMenuItemById("avi").enabled = true;
                    // Menu.getApplicationMenu().getMenuItemById("webm").enabled = true;
                  }
                })
                .catch((err) => console.log(err));
            },
          },
          {
            type: "separator",
          },
          {
            label: "Merge multiple videos",
            id: "mp4",
            enabled: false,
            click(event, window) {
              convertVideoFormat(window, "mp4");
            },
          },
          // {
          //     label: "Convert to AVI...",
          //     id: "avi",
          //     enabled: false,
          //     click(event, window) {
          //         convertVideoFormat(window, "avi");
          //     }
          // },
          // {
          //     label: "Convert to webm...",
          //     id: "webm",
          //     enabled: false,
          //     click(event, window) {
          //         convertVideoFormat(window, "webm");
          //     }
          // }
        ],
      },
      { type: "separator" },
      {
        label: "Quit Video Player",
        role: global.isMac ? "close" : "quit",
      },
    ],
  },
  {
    label: "Developer Tools",
    submenu: [
      { role: "toggleDevTools" },
      { role: "togglefullscreen" },
      { role: "minimize" },
      { role: "zoomIn" },
      { role: "zoomOut" },
    ],
  },
];

function convertVideoFormat(dialogWindow, fileType) {
  console.log("Converting video to ", selectedFilePaths);
  dialog.showSaveDialog(dialogWindow).then((res) => {
    // const progressBar = new ProgressBar({
    //   indeterminate: false,
    //   text: `Converting video to ${fileType}. Please wait...`,
    //   detail: "0%",
    // });
    // progressBar
    //   .on("progress", (value) => {
    //     progressBar.detail = `${Number(value).toFixed(0)}%`;
    //   })
    //   .on("completed", () => {
    //     progressBar.detail = "Video File Type Conversion Complete!";
    //   });
    const namingInput = (index: number) => `${index}`
    const namingOutput = (index: number) => `output${index}`

    const configOption = {
      scale: "hd_plus",
      ratio: "4:3",
      export: "mp4",
      fileName: `${res.filePath}.${fileType}`
    }

    const ffmpegCmd = ffmpeg();

    selectedFilePaths.forEach((filePath) => {
      ffmpegCmd.input(filePath);
    })

    ffmpegCmd
      .complexFilter([
        ...selectedFilePaths.map((_, index) =>
          `[${namingInput(index)}]${VIDEO_FILTER.scale(configOption.scale)},${VIDEO_FILTER.pad(configOption.scale)},${VIDEO_FILTER.aspectRatio(configOption.ratio)}[${namingOutput(index)}]`
        ),
        selectedFilePaths
          .map((_, index) => `[${namingOutput(index)}][${index}:a]`).join('')
          .concat(`concat=n=${selectedFilePaths.length}:v=1:a=1[video][audio]`)
      ])
      .outputOptions([
        VIDEO_OPTIONS.mergeVideo,
        VIDEO_OPTIONS.mergeAudio,
        // VIDEO_OPTIONS.animation,
        VIDEO_OPTIONS.libx264,
        VIDEO_OPTIONS.crf27,
        VIDEO_OPTIONS.ultrafast,
        VIDEO_OPTIONS.threads4,
        // VIDEO_OPTIONS.strict,
        VIDEO_OPTIONS[configOption.export],
      ])
      .save(configOption.fileName)
      .on("start", (commandLine: string) =>
        console.log(colors.blue("👉 Waiting:::", commandLine))
      )
      .on("progress", (progress: Record<string, any>) => {
        console.log(colors.yellow("👉 Progress:::", progress));
      })
      .on("error", (err: Record<string, any>) => {
        // progressBar.value = 100;
        console.log(colors.red("👉 ERROR:::", err.message))
        // const NOTIFICATION_TITLE = "Merge Video Failed";
        // const NOTIFICATION_BODY = err.message;

        // new Notification({
        //   title: NOTIFICATION_TITLE,
        //   body: NOTIFICATION_BODY,
        //   icon: path.join(__dirname, "video-icon.png"),
        //   silent: false,
        // }).show();
      })
      .on("end", () => {
        // progressBar.value = 100;
        console.log(colors.green("👉 DONE !!!!"))

        // const NOTIFICATION_TITLE = "Merge Video Finished";
        // const NOTIFICATION_BODY = "Video File Type Conversion Finished";

        // new Notification({
        //   title: NOTIFICATION_TITLE,
        //   body: NOTIFICATION_BODY,
        //   icon: path.join(__dirname, "video-icon.png"),
        //   silent: false,
        // }).show();
      })
  });
}

export default Menu.buildFromTemplate(myMenuTemplate);
