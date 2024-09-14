import QR from '../../../build/QR.js';

const contentIn = document.querySelector('#in') as HTMLTextAreaElement;
const levelIn = document.querySelector('#eccLevel') as HTMLSelectElement;
const maskIn = document.querySelector('#mask') as HTMLSelectElement;
const generateBtn = document.querySelector('#generate') as HTMLButtonElement;
const error = document.querySelector('#error') as HTMLParagraphElement;
const img = document.querySelector('#qr') as HTMLImageElement;

async function generate() {
    const content = contentIn.value;
    const eccLevel = levelIn.value;
    const mask = parseInt(maskIn.value);
    if (isNaN(mask) || mask < 0 || mask > 7) {
        error.textContent = 'Invalid mask';
        return;
    }
    console.log('Generating QR code...')
    try {
        if (!QR.isSupportedEccLevel(eccLevel)) throw new Error('Invalid ECC level');
        if (!QR.isSupportedMask(mask)) throw new Error('Invalid mask');
        error.textContent = '';
        const qr = new QR(content, { minVersion: 3, eccLevel, mask, icon: true });
        console.log('QR code generated, version:', qr.version, ', eccLevel:', qr.eccLevel);
        console.log('Displaying QR code...');
        const drawer = qr.imageDrawer;
        if (!drawer) throw new Error('No image drawer');
        // drawer.debugMode = true;
        const style = drawer.style;
        style.moduleRadius = "50%";
        style.moduleMargin = "4%";
        style.padding = '50%';
        style.margin = '10%';
        style.background = {
            colors: ["#F00", '#FFB4DC', '#B4DCFF', '#000'],
            percentages: [0, 1, 99, 100],
            type: 'linear',
            direction: 0,
        };
        style.inactiveColor = {
            type: 'linear',
            colors: ['#FFB4DC', "#FFFFFF", "#B4DCFF"]
        };
        style.activeColor = {
            type: 'radial',
            colors: ['#FF0000', "#000088"]
        };
        await drawer.addImage('./assets/Logo.svg');
        img.src = await drawer.dataUrl(400);
        console.log('QR code displayed');
    } catch (e) {
        console.error('Error generating QR code:', e);
        error.textContent = e + "";
    }
}

generateBtn.addEventListener('click', () => generate());
generate();

//@ts-ignore
window.QR = QR;