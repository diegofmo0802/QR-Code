import Matrix from "./Matrix.js";
import QR from "./QR.js";

export class Drawer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private image: string | null = null;
    /** the calculated radius */
    private _moduleRadius: number = 0;
    /** the radius provided by the user */
    private _ModuleRadius: Drawer.SizeValue = 0;
    /** the calculated margin */
    private _moduleMargin: number = 0;
    /** the margin provided by the user */
    private _ModuleMargin: Drawer.SizeValue = 0;
    /** the background color of the QR code */
    private _backgroundColor: `#${string}` = '#00B4FF';
    /**
     * Create a new QR code drawer
     * @param qr QR code to draw
     * @param imageSize Size of the image
     */
    private constructor(
        public readonly qr: QR,
        private imageSize: number = qr.size * 10
    ) {
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('fail to get canvas context');
        this.ctx = ctx;
        this.canvas.width = imageSize;
        this.canvas.height = imageSize;
        // this.reDraw();
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
    public static create(qr: QR, imageSize: number = qr.size * 10): Drawer {
        if (
            typeof window === 'undefined' ||
            typeof document === 'undefined' ||
            typeof HTMLCanvasElement === 'undefined' ||
            typeof HTMLImageElement === 'undefined'
        ) throw new Error('Drawer is only allowed in browser');
        return new Drawer(qr, imageSize);
    }
    /**
     * Get the size of the QR code
     * @returns Size of the QR code
     */
    public get size(): number {
        return this.imageSize;
    }
    public set size(size: number) {
        this.imageSize = size;
        this.canvas.width = size;
        this.canvas.height = size;
        this.recalculate();
        // this.reDraw();
    }
    /**
     * Get the size of the module
     * @returns Size of the module
     */
    private get moduleSize() {
        return Math.floor(this.imageSize / this.qr.size);
    }
    /**
     * Get the surplus of moduleSize floor calculates
     * @returns Surplus of moduleSize floor calculates
     */
    private get moduleSurplus(): number {
        return (this.imageSize % this.qr.size);
    }
    /**
     * Get the canvas element
     * @returns Canvas element
     */
    public get canvasElement(): HTMLCanvasElement {
        return this.canvas.cloneNode() as HTMLCanvasElement;
    }
    public get debugMode(): boolean {
        return this.qr.debugMode;
    }
    public set debugMode(mode: boolean) {
        this.qr.debugMode = mode
        // this.reDraw();
    }
    /**
     * Get the data URL of the QR code
     * @returns Data URL of the QR code
     */
    public async dataUrl(): Promise<string> {
        await this.reDraw();
        return this.canvas.toDataURL();
    }
    /**
     * Redraw the QR code
     */
    public async reDraw(): Promise<void> {
        await this.drawMatrix(this.ctx, this.qr.QRMatrix);
        if (this.image !== null) {
            await this.drawImage(this.ctx, this.image);
        }
    }
    /**
     * Draw the matrix on the canvas
     * @param canvas Canvas to draw on
     * @param matrix Matrix to draw
     */
    private drawMatrix1(canvas: HTMLCanvasElement, matrix: Matrix): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no context to draw');
        ctx.imageSmoothingEnabled = false;
        const moduleSize = this.moduleSize;
        const padding = this.moduleSurplus / 2;
        const moduleMargin = this.moduleMargin;
        const moduleRadius = this.moduleRadius;
        const pointSize = moduleSize - moduleMargin;
        let posRow = padding; let posCol = padding;
        
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.imageSize, this.imageSize);

        for (const row of matrix.data) {
            for (const bit of row)  {
                ctx.fillStyle = bit < 0
                ? bit == -1 ? 'red' : bit == -2 ? 'green' : 'yellow' 
                : bit == 1 ? 'black' : 'white';
                this.drawRoundedRect(ctx, posCol, posRow, pointSize, pointSize, moduleRadius);
                posCol += moduleSize;
            }
            posCol = padding; posRow += moduleSize;
        }
    }
    /**
     * Draw the matrix on the canvas
     * @param ctx Canvas context
     * @param matrix Matrix to draw
     */
    private async drawMatrix(ctx: CanvasRenderingContext2D, matrix: Matrix): Promise<void> {
        const increaseFactor = 1000;
        const svgSize = this.moduleSize * this.qr.size * increaseFactor;
        let svgContent = ''
        
        const moduleSize = this.moduleSize * increaseFactor;
        const padding = 0;
        const moduleMargin = this.moduleMargin * increaseFactor;
        const moduleRadius = this.moduleRadius * increaseFactor;
        const pointSize = moduleSize - moduleMargin;

        let posRow = padding;
        let posCol = padding;
        svgContent += `<rect width="${svgSize}" height="${svgSize}" fill="${this.backgroundColor}"/>`;
        for (const row of matrix.data) {
            for (const bit of row) {
                const fillColor = bit < 0
                ? bit == -1 ? 'red' : bit == -2 ? 'green' : 'yellow' 
                : bit == 1 ? 'black' : 'white';
                svgContent += [
                    '<rect',
                    `x="${posCol}" y="${posRow}"`,
                    `width="${pointSize}" height="${pointSize}"`,
                    `rx="${moduleRadius}" ry="${moduleRadius}"`,
                    `fill="${fillColor}" stroke="${fillColor}" stroke-width="${1 * increaseFactor}"`,
                    '/>'
                ].join(' ');
                posCol += moduleSize;
            }
            posCol = padding;
            posRow += moduleSize;
        }
        const svg = Drawer.generateSvg(svgSize, svgSize, svgContent);
        await this.drawSvg(ctx, svg, 0, 0, this.size, this.size);
    }
    /**
     * Draw a rounded rectangle on the canvas
     * @param ctx Canvas context
     * @param x X position
     * @param y Y position
     * @param width Width
     * @param height Height
     * @param radius Radius
     */
    private drawRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, 
        width: number, height: number, radius: number
    ) {
        const maxRadius = Math.min(width / 2, height / 2);
        if (radius > maxRadius) radius = maxRadius;
    
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
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
            img.onerror = () => {
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
     * Draw an image on the canvas
     * @param ctx Canvas context
     * @param image Image to draw
     */
    public async drawImage(ctx: CanvasRenderingContext2D, image: string): Promise<void> {
        const increaseFactor = 1000;
        const qrArea = this.qr.QRMatrix.maxBitsData;
        const iconArea = Math.floor(qrArea * 0.15);
        let iconSize = Math.floor(Math.sqrt(iconArea));
        if (iconSize % 2 === 0) iconSize--;
        iconSize *= this.moduleSize * increaseFactor;
        const svgSize = this.moduleSize * this.qr.size * increaseFactor;
        const border = 1 * increaseFactor
        const centerOffset = (svgSize / 2) - (iconSize / 2) - (border / 2);
        
        const svg = Drawer.generateSvg(
            svgSize, svgSize,
            `<rect stroke="black" stroke-width="${border / 2}" x="${centerOffset}" y="${centerOffset}" width="${iconSize}" height="${iconSize}" fill="${this.backgroundColor}"/>`
            + `<image x="${centerOffset}" y="${centerOffset}" fill="red" width="${iconSize}" xlink:height="${iconSize}" href="${image}" />`
        );
        await this.drawSvg(ctx, svg, 0, 0, this.size, this.size);
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
        this.image = dataUrl;
        await this.drawImage(this.ctx, dataUrl);
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
     * Parse a value to a number
     * - if the value is a number, it is returned as is
     * - if the value is a string, it is parsed to a number
     * - if the value is a string with a percentage sign, it is parsed to a number and multiplied by 0.01
     * - if the value is a string with a pixel unit, it is parsed to a number and multiplied by 10
     * @param value Value to parse
     * @param reference Reference value
     * @returns Parsed value
     */
    public static parseValue(value: Drawer.SizeValue, reference: number, maximum?: number): number {
        if (typeof value === 'string') {
            if (value.endsWith('%')) value = (parseInt(value.slice(0, -1)) / 100) * reference;
            else if (value.endsWith('px')) value = parseInt(value.slice(0, -2));
            else value = parseInt(value);
        }
        if (typeof value !== 'number' || isNaN(value)) return 0;
        return maximum && value > maximum ? maximum : value;
    }
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
    /* PROPERTIES SECTION */
    /* CALCULATE NUMERIC PROPERTIES */
    private recalculate(): void {
        this.calculateMargin();
        this.calculateRadius();
    }
    private calculateMargin(): void {
        const maxMargin = this.moduleSize * 0.2;
        this._moduleMargin = Drawer.parseValue(this._ModuleMargin, this.moduleSize, maxMargin);
    }
    private calculateRadius(): void {
        const maxRadius = this.moduleSize * 0.5;
        this._moduleRadius = Drawer.parseValue(this._ModuleRadius, this.moduleSize, maxRadius);
    }
    /* GETTERS Y SETTERS */
    public get backgroundColor(): Drawer.ColorValue {
        return this._backgroundColor;
    }
    public set backgroundColor(color: Drawer.ColorValue) {
        this._backgroundColor = color;
        // this.reDraw();
    }
    /**
     * Get the margin of the module
     * @returns Margin of the module
     */
    public get moduleMargin(): number {
        return this._moduleMargin;
    }
    /**
     * Set the margin of the module
     * - the max margin is 1/5 of the module size
     * - if you surplus the max margin, the margin will be set to the max margin
     * - the margin can be a number or a percentage of the module size
     * - the margin can be a string with a percentage sign
     * @param margin Margin of the module
     * @throws Error if the margin is invalid
     * @example qr.moduleMargin = 5; // margin is 5px
     * @example qr.moduleMargin = '5%' // margin is 5% of module size
     */
    public set moduleMargin(margin: number | `${number}%`) {
        this._ModuleMargin = margin;
        this.calculateMargin();
        // this.reDraw();
    }
    
    /**
     * Get the radius of the module
     * @returns Radius of the module
     */
    public get moduleRadius(): number {
        return this._moduleRadius;
    }
    /**
     * Set the radius of the module
     * @param radius Radius of the module
     * - the max radius is the size of the module divided by 2
     * - if you surplus the max radius, the radius will be set to the max radius
     * - the radius can be a number or a percentage of the module size
     * - the radius can be a string with a percentage sign
     * @throws Error if the radius is invalid
     * @example qr.moduleRadius = 5; // radius is 5px
     * @example qr.moduleRadius = '5%' // radius is 5% of module size
     * @example qr.moduleRadius = '5px';
     */
    public set moduleRadius(radius: number | `${number}%`) {
        this._ModuleRadius = radius;
        this.calculateRadius();
        // this.reDraw();
    }
}

export namespace Drawer {
    export type SizeValue = number | `${number}%` | `%{number}px`;
    export type ColorValue = `#${string}`;
}

export default Drawer;