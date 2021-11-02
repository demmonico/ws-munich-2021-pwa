import { bresenhamLine, getImage, toBlob } from "./helpers.js";

const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d', {
    desynchronized: true
});

// init
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = 'black';

//
let previousPoint;
canvas.addEventListener('pointerdown', event => {
    previousPoint = {
        x: ~~event.offsetX,
        y: ~~event.offsetY
    };
});
canvas.addEventListener('pointermove', event => {
    if (previousPoint) {
        const currentPoint = {
            x: ~~event.offsetX,
            y: ~~event.offsetY
        };
        for (let point of bresenhamLine(previousPoint.x, previousPoint.y, currentPoint.x, currentPoint.y)) {
            ctx.fillRect(point.x, point.y, 2, 2);
        }
        previousPoint = currentPoint
    }
});
canvas.addEventListener('pointerup', event => {
    previousPoint = null;
});

// colorpicker
const txtColor = document.querySelector('#color');
txtColor.addEventListener('change', () => {
    ctx.fillStyle = txtColor.value;
})

//////////////////////////////
// files

const fileOptions = {
    types: [{
        description: 'PNG files',
        accept: {'image/png': ['.png']}
    }]
};

// save btn
const btnSave = document.querySelector('#save');
if ('showSaveFilePicker' in window) {
    btnSave.addEventListener('click', async () => {
        const blob = await toBlob(canvas);
        const handle = await window.showSaveFilePicker(fileOptions);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
    });
// fallback
} else {
    btnSave.addEventListener('click', async () => {
        const blob = await toBlob(canvas);
        const anchor = document.createElement('a');
        const url = URL.createObjectURL(blob);
        anchor.href = url;
        anchor.download = 'untitle.png';
        anchor.click();
        URL.revokeObjectURL(url);
    });
}

// open btn
const btnOpen = document.querySelector('#open');
btnOpen.disabled = !('showOpenFilePicker' in window);
btnOpen.addEventListener('click', async () => {
    const [handle] = await window.showOpenFilePicker(fileOptions);
    const file = await handle.getFile();
    const image = await getImage(file);
    ctx.drawImage(image, 0, 0);
});

// copy btn
const btnCopy = document.querySelector('#copy');
// btnCopy.disabled = !('clipboard' in navigator && 'write' in navigator.clipboard);
btnCopy.disabled = !('clipboard' in navigator) || (typeof navigator.clipboard.write !== "function");
btnCopy.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    await navigator.clipboard.write([
        new ClipboardItem({[blob.type]: blob})
    ]);
});

// paste btn
const btnPaste = document.querySelector('#paste');
btnPaste.disabled = !('clipboard' in navigator) || (typeof navigator.clipboard.read !== "function");
btnPaste.addEventListener('click', async () => {
    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
            if (type === 'image/png') {
                const blob = await clipboardItem.getType(type);
                const image = await getImage(blob);
                ctx.drawImage(image, 0, 0);
            }
        }
    }
});

// share btn (don't yet works in Chrome MacOS)
const btnShare = document.querySelector('#share');
btnShare.disabled = !('canShare' in navigator);
btnShare.addEventListener('click', async () => {
    const blob = await toBlob(canvas);
    const file = new File([blob], 'untitled.png', {type: 'image/png'});
    const item = {files: [file], title: 'untitle.png'};
    if (await navigator.canShare(item)) {
        await navigator.share(item);
    }
});

// file handler
if ('launchQueue' in window) {
    launchQueue.setConsumer(async params => {
        const [handle] = params.files;
        if (handle) {
            const file = await handle.getFile();
            const image = await getImage(file);
            ctx.drawImage(image, 0, 0);
        }
    });
}
