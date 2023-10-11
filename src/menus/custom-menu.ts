import {
    dialog,
    Menu,
    Notification
} from 'electron';
import ProgressBar from "electron-progressbar";
// import ffmpegStatic from "ffmpeg-static-electron";
// import ffprobe from "ffprobe-static-electron";
// import ffmpeg from "fluent-ffmpeg";
// import path from "path";

const ffmpegStatic = require("ffmpeg-static-electron");
const ffprobe = require("ffprobe-static-electron");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegStatic.path);

const dialogFileType = { name: 'Videos', extensions: ['mp4', 'mov'] };

const dialogOptions = {
    properties: ['openFile', 'multiSelections'],
    message: "Select Video File to load",
    filters: [dialogFileType]
};


// let selectedFilePath;
let selectedFilePaths = [];

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
                            dialog.showOpenDialog(dialogWindow, dialogOptions)
                                .then(response => {
                                    if (response.filePaths.length) {
                                        // selectedFilePath = response.filePaths[0];
                                        selectedFilePaths = response.filePaths;
                                        // send file path to renderer
                                        // open file in window
                                        // dialogWindow.webContents.send("filePath", { filePath: selectedFilePath });
                                        Menu.getApplicationMenu().getMenuItemById("mp4").enabled = true;
                                        // Menu.getApplicationMenu().getMenuItemById("avi").enabled = true;
                                        // Menu.getApplicationMenu().getMenuItemById("webm").enabled = true;
                                    }
                                })
                                .catch((err) => console.log(err));
                        }
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Merge multiple videos",
                        id: "mp4",
                        enabled: false,
                        click(event, window) {
                            convertVideoFormat(window, "mp4");
                        }
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
                ]
            },
            { type: "separator" },
            {
                label: "Quit Video Player",
                role: global.isMac ? "close" : "quit",
            }
        ],
    },
    {
        label: "Developer Tools",
        submenu: [
            { role: "toggleDevTools" },
            { role: "togglefullscreen" },
            { role: "minimize" },
            { role: "zoomIn" },
            { role: "zoomOut" }
        ],
    }
];

function convertVideoFormat(dialogWindow, fileType) {
    console.log("Converting video to ", selectedFilePaths);
    dialog.showSaveDialog(dialogWindow).then((res) => {
        const progressBar = new ProgressBar({
            indeterminate: false,
            text: `Converting video to ${fileType}. Please wait...`,
            detail: "0%"
        });
        progressBar
            .on("progress", (value) => {
                progressBar.detail = `${Number(value).toFixed(0)}%`;
            })
            .on("completed", () => {
                progressBar.detail = "Video File Type Conversion Complete!";
            });

        const firstVideo = selectedFilePaths.shift();

        const ffmpegProcess = ffmpeg(firstVideo)

        selectedFilePaths.forEach((filePath) => {
            ffmpegProcess.mergeAdd(filePath)
        });

        ffmpegProcess.on("progress", (progress) => {
                // console.log("Progress: ", progress);

                if (!progressBar.isCompleted()) {
                    progressBar.value = progress.percent >= 100 ? 99 : progress.percent;
                }
            })
            .on('error', (err) => {
                progressBar.value = 100;
                console.log('An error occurred: ' + err.message);
                const NOTIFICATION_TITLE = 'Merge Video Failed'
                const NOTIFICATION_BODY = err.message

                new Notification({
                    title: NOTIFICATION_TITLE,
                    body: NOTIFICATION_BODY,
                    icon: path.join(__dirname, 'video-icon.png'),
                    silent : false
                }).show()
            })
            .on("end", () => {
                progressBar.value = 100;

                const NOTIFICATION_TITLE = 'Merge Video Finished'
                const NOTIFICATION_BODY = 'Video File Type Conversion Finished'

                new Notification({
                    title: NOTIFICATION_TITLE,
                    body: NOTIFICATION_BODY,
                    icon: path.join(__dirname, 'video-icon.png'),
                    silent : false
                }).show()
            })
            // .setSize("960x540") // not working
            .mergeToFile(`${res.filePath || new Date().getTime()}.${fileType}`, "./tmp")
    });
}

export default Menu.buildFromTemplate(myMenuTemplate);