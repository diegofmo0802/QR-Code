import Style from "./Style.js";
import Matrix from "./Matrix.js";
import QR from "./QR.js";

export class Drawer {
    public readonly style: Style;
    private icon: string | null = null;
    /**
     * Create a new QR code drawer
     * @param qr QR code to draw
     * @param imageSize Size of the image
     */
    private constructor(
        public readonly qr: QR,
    ) {
        this.style = new Style(qr.size);
    }
    /**
     * Create a new QR code drawer
     * @param qr QR code to draw
     * @param imageSize Size of the image
     * @returns Drawer
     * @throws Error if not in browser
     * @example
     *  const qr = new QR('Hello World!', { eccLevel: 'L', mask: 5 });
     *  const drawer = Drawer.create(qr);
     *  const source = drawer.dataUrl;
     *  const img = new Image();
     *  img.src = source;
     *  document.body.appendChild(img);
     */
    public static create(qr: QR): Drawer {
        if (
            typeof window === 'undefined' ||
            typeof document === 'undefined' ||
            typeof HTMLCanvasElement === 'undefined' ||
            typeof HTMLImageElement === 'undefined'
        ) throw new Error('Drawer is only allowed in browser');
        return new Drawer(qr);
    }
    /**
     * Get the debug mode
     * @returns Debug mode
     */
    public get debugMode(): boolean {
        return this.qr.debugMode;
    }
    /**
     * Set the debug mode
     * @param mode Debug mode
     */
    public set debugMode(mode: boolean) {
        this.qr.debugMode = mode
    }
    /**
     * Get the SVG of the QR code
     * @returns SVG of the QR code
     */
    public get svg(): string {
        return this.draw();
    }
    /**
     * Get the data URL of the QR code
     * @param size Size of the image
     * @returns Promise that resolves when the image is loaded
     */
    public async dataUrl(size?: number): Promise<string> {
        size = size || this.style.totalSize;
        const svg = this.draw();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');
        await this.drawSvg(ctx, svg, 0, 0, size, size);
        return canvas.toDataURL();
    }
    /**
     * Draw the QR code
     * @returns SVG of the QR code
     */
    private draw(): string {
        const style = this.style;
        const svgStyles = Style.drawStyles(style);
        const svgMatrix = this.drawMatrix(this.qr.QRMatrix);
        const svgIcon = this.icon ? this.drawIcon(this.icon) : '';
        const svgContent = svgStyles + svgMatrix + svgIcon;
        const svg = Drawer.generateSvg(style.totalSize, style.totalSize, svgContent);
        return svg
    }
    /**
     * Draw the matrix on the canvas
     * @param ctx Canvas context
     * @param matrix Matrix to draw
     */
    private drawMatrix(matrix: Matrix): string {
        const style = this.style;
        const matrixSize = style.matrixSize + (style.padding * 2);
        const pointSize = style.moduleSize - style.moduleMargin;
        const padding = style.padding + style.moduleMargin;
        const margin = style.margin + style.moduleMargin;
        const sideSkip = padding + margin;

        const activeModules: string[] = ['<g id="active-modules">'];
        const inactiveModules: string[] = ['<g id="inactive-modules">'];
        const debugModules: string[] = ['<g id="debug-modules">'];

        const svgContent: string[] = [];

        let posRow = sideSkip;
        let posCol = sideSkip;
        svgContent.push(`<rect x="${margin}" y="${margin}" width="${matrixSize}" height="${matrixSize}" fill="url(#background-gradient)"/>`);
        for (const row of matrix.data) {
            for (const bit of row) {
                const toPush = bit < 0
                ? debugModules
                : bit == 1 ? activeModules : inactiveModules;
                const fillColor = bit < 0
                ? bit == -1 ? 'red' : bit == -2 ? 'green' : 'yellow' 
                : bit == 1 ? 'url(#active-gradient)' : 'url(#inactive-gradient)';
                toPush.push([
                    '<rect',
                    `x="${posCol}" y="${posRow}"`,
                    `width="${pointSize}" height="${pointSize}"`,
                    `rx="${style.moduleRadius}" ry="${style.moduleRadius}"`,
                    '/>'
                ].join(' '));
                posCol += style.moduleSize;
            }
            posCol = sideSkip;
            posRow += style.moduleSize;
        }
        activeModules.push('</g>');
        inactiveModules.push('</g>');
        debugModules.push('</g>');
        svgContent.push(...activeModules, ...inactiveModules, ...debugModules);
        return svgContent.join(' ');
    }
    /**
     * Draw an image on the canvas
     * @param ctx Canvas context
     * @param image Image to draw
     */
    private drawIcon(image: string): string {
        const style = this.style;
        const qrArea = this.qr.QRMatrix.maxBitsData;
        const iconArea = Math.floor(qrArea * 0.15);
        let iconSize = Math.floor(Math.sqrt(iconArea));
        if (iconSize % 2 === 0) iconSize--;
        iconSize *= style.moduleSize;
        const svgSize = style.totalSize
        const border = 10
        const centerOffset = (svgSize / 2) - (iconSize / 2) - (border / 2);
        
        const svgContent = [
            `<rect stroke="black" stroke-width="${border / 2}" x="${centerOffset}" y="${centerOffset}" width="${iconSize}" height="${iconSize}" fill="url(#background-gradient)"/>`,
            `<image x="${centerOffset}" y="${centerOffset}" fill="red" width="${iconSize}" xlink:height="${iconSize}" href="${image}" />`
        ].join(' ');
        return svgContent;
    }
    /**
     * Draw an SVG on the canvas
     * @param ctx Canvas context
     * @param svg SVG to draw
     * @param x X position
     * @param y Y position
     * @param width Width
     * @param height Height
     */
    private async drawSvg(
        ctx: CanvasRenderingContext2D, svg: string,
        x: number, y: number, width: number, height: number
    ): Promise<void> {
        const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
            img.onerror = (e) => {
                reject(new Error('Error drawing SVG'));
            };
            img.onload = () => {
                ctx.drawImage(img, x, y, width, height);
                resolve(true);
            };
        });
        URL.revokeObjectURL(url);
    }
    /**
     * Add an image to the QR code
     * @param url URL of the image
     * @returns Promise that resolves when the image is added
     * @example await qr.addImage('https://example.com/image.png');
     * @example await qr.addImage('./image.png');
     */
    public async addImage(url: string): Promise<void> {
        const dataUrl = await this.loadImage(url);
        this.icon = dataUrl;
    }
    /**
     * Load an image from a URL
     * @param src URL of the image
     * @returns Promise that resolves when the image is loaded
     */
    private async loadImage(src: string): Promise<string> {
        const rs = await fetch(src);
        const blob = await rs.blob();
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => {
                reject(new Error('Error loading image'));
                console.error('Error loading image:', reader.error);
            };
            reader.readAsDataURL(blob);
        });
    }
    /**
     * Generate an SVG
     * @param width Width of the SVG
     * @param height Height of the SVG
     * @param content Content of the SVG
     * @returns SVG
     */
    public static generateSvg(width: number, height: number, content: string): string {
        const svgNamespace = "http://www.w3.org/2000/svg";
        const svgXlinkNamespace = "http://www.w3.org/1999/xlink";
        const svgVersion = "1.1";
        let svgContent = [
            '<svg',
            // 'style="shape-rendering: crispEdges"',
            `xmlns="${svgNamespace}"`,
            `xmlns:xlink="${svgXlinkNamespace}"`,
            `version="${svgVersion}"`,
            `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
            content,
            '</svg>'
        ].join(' ');
        return svgContent;
    }
}

export namespace Drawer {
    export type SizeValue = number | `${number}%` | `%{number}px`;
    export type ColorValue = `#${string}`;
}

export default Drawer;