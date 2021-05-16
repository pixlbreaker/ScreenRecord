
// Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
const mp4Selection = document.getElementById('mp4');
videoSelectBtn.onclick = getVideoSources;


const {desktopCapturer, remote} = require('electron');
const { Menu } = remote;

// Starts the Media Recording
startBtn.onclick= function(e){
    mediaRecorder.start();
};

stopBtn.onclick = function(){
    mediaRecorder.stop();
}


// Get the available video sources
async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return{
                label: source.name,
                click: () => selectSource(source)
            }
        })
    );

    videoOptionsMenu.popup();
}

let mediaRecorder;
const recordedChunks = [];

// Change the videoSource winodw to record
async function selectSource(source){
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    if (mp4Selection.checked){
        options = { mimeType: 'video/mp4' };
        console.log('here');
    }
    mediaRecorder = new MediaRecorder(stream, options);
    //console.log('here');

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

}

// Captures all recorded chunks
function handleDataAvailable(e){
    console.log('video data available');
    recordedChunks.push(e.data);
}

const {dialog} = remote;
const { writeFile}= require('fs');

// Saves the video file on stop
async function handleStop(e){
    if(mp4Selection.checked){
        const blob = new Blob(recordedChunks, {
            type: 'video/mp4'
        });

        const buffer = Buffer.from(await blob.arrayBuffer());

        const {filePath} = await dialog.showSaveDialog({
            buttonLabel: 'Save Video',
            defaultPath: `vid-${Date.now()}.mp4`
        });
    
        writeFile(filePath, buffer, () => console.log('video successfully saved'));
    } else {
        const blob = new Blob(recordedChunks, {
            type: 'video/webm; codeccs=vp9'
            });

        const buffer = Buffer.from(await blob.arrayBuffer());

        const {filePath} = await dialog.showSaveDialog({
            buttonLabel: 'Save Video',
            defaultPath: `vid-${Date.now()}.webm`
        });
    
        writeFile(filePath, buffer, () => console.log('video successfully saved'));
    }
}