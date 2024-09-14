export class Style {
    public readonly moduleSize: number;
    public readonly matrixSize: number;
    private _moduleRadius: number = 0;
    private _moduleMargin: number = 0;
    private _padding: number = 0;
    private _margin: number = 0;
    private _background: Style.gradient = Style.parseColor('#00B4FF');
    private _activeColor: Style.gradient = Style.parseColor('#000000');
    private _inactiveColor: Style.gradient = Style.parseColor('#FFFFFF');
    public constructor(
        private readonly matrixSideModules: number,
    ) {
        this.moduleSize = 100;
        this.matrixSize = matrixSideModules * this.moduleSize;
    }
    public get totalSize(): number {
        let totalSize = this.matrixSize;
        totalSize += this.padding * 2;
        totalSize += this.margin * 2;
        return totalSize;
    }
    public set margin(margin: Style.SizeValue) {
        if (typeof margin === 'number') margin = margin *= this.moduleSize;
        this._margin = Style.parseSizeValue(margin, this.matrixSize);
    }
    public get margin(): number {
        return this._margin;
    }
    public set padding(padding: Style.SizeValue) {
        if (typeof padding === 'number') padding = padding *= this.moduleSize;
        this._padding = Style.parseSizeValue(padding, this.matrixSize);
    }
    public get padding(): number {
        return this._padding;
    }
    public get moduleRadius(): number {
        return this._moduleRadius;
    }
    public set moduleRadius(moduleRadius: Style.SizeValue) {
        const moduleSize = this.moduleSize;
        const maximum = this.moduleSize * 0.5;
        this._moduleRadius = Style.parseSizeValue(moduleRadius, moduleSize, maximum);
    }
    public get moduleMargin(): number {
        return this._moduleMargin;
    }
    public set moduleMargin(moduleMargin: Style.SizeValue) {
        const moduleSize = this.moduleSize;
        const maximum = moduleSize * 0.3;
        this._moduleMargin = Style.parseSizeValue(moduleMargin, moduleSize, maximum);
    }
    public get background(): Style.gradient {
        return this._background;
    }
    public set background(backgroundColor: Style.ColorValue | Style.gradientOptions) {
        this._background = Style.parseColor(backgroundColor);
    }
    public get activeColor(): Style.gradient {
        return this._activeColor;
    }
    public set activeColor(activeColor: Style.ColorValue | Style.gradientOptions) {
        this._activeColor = Style.parseColor(activeColor);
    }
    public get inactiveColor(): Style.gradient {
        return this._inactiveColor;
    }
    public set inactiveColor(inactiveColor: Style.ColorValue | Style.gradientOptions) {
        this._inactiveColor = Style.parseColor(inactiveColor);
    }
    public setStyles(styles: Style.Styles) {
        if (styles.moduleRadius != null) this.moduleRadius = styles.moduleRadius;
        if (styles.moduleMargin != null) this.moduleMargin = styles.moduleMargin;
        if (styles.padding != null) this.padding = styles.padding;
        if (styles.margin != null) this.margin = styles.margin;
        if (styles.background != null) this.background = styles.background;
        if (styles.activeColor != null) this.activeColor = styles.activeColor;
        if (styles.inactiveColor != null) this.inactiveColor = styles.inactiveColor;
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
    public static parseSizeValue(value: Style.SizeValue, reference: number, maximum?: number): number {
        if (typeof value === 'string') {
            if (value.endsWith('%')) value = (parseInt(value.slice(0, -1)) / 100) * reference;
            else if (value.endsWith('px')) value = parseInt(value.slice(0, -2));
            else value = parseInt(value);
        }
        if (typeof value !== 'number' || isNaN(value)) return 0;
        return maximum && value > maximum ? maximum : value;
    }
    /**
     * Parse a color to a gradient
     * @param color Color to parse
     * @returns Parsed color
     */
    public static parseColor(color: Style.ColorValue | Style.gradientOptions): Style.gradient {
        if (typeof color === 'string') return {
            type: 'linear',
            colors: [color],
            direction: 0,
            percentages: [0, 100],
        };
        if (color.type === 'linear') {
            return {
                type: 'linear',
                colors: color.colors,
                direction: color.direction != null ? color.direction : 0,
                percentages: color.percentages != null ? color.percentages : color.colors.map((_, index, array) => (index / (array.length - 1)) * 100),
            };
        } else {
            return {
                type: 'radial',
                colors: color.colors,
                percentages: color.percentages != null ? color.percentages : color.colors.map((_, index, array) => (index / (array.length - 1)) * 100),
                cx: color.cx != null ? color.cx : 50,
                cy: color.cy != null ? color.cy : 50,
                r: color.r != null ? color.r : 50,
            };
        }
    }
    /**
     * Generate a gradient
     * @param id ID of the gradient
     * @param gradient Gradient to generate
     * @returns SVG gradient
     */
    private static generateGradient(id: string, gradient: Style.gradient, size: number, margin: number = 0): string {
        const type = gradient.type === 'radial' ? 'radialGradient' : 'linearGradient';
        const center = size / 2;
        const gradientSize = size - (margin * 2);
        const parameters: string[] = [];
        if (gradient.type === 'linear') {
            const { x: x1, y: y1 } = Style.calculateBorderPosition(gradientSize, gradient.direction + 180);
            const { x: x2, y: y2 } = Style.calculateBorderPosition(gradientSize, gradient.direction);
            parameters.push(
                `x1="${x1 + center}"`,
                `y1="${y1 + center}"`,
                `x2="${x2 + center}"`,
                `y2="${y2 + center}"`
            );
        } else if (gradient.type === 'radial') {
            const marginPer = (margin / size) * 100;
            const gradientUnit = (gradientSize) / 100;
            const cx = (gradientUnit * gradient.cx) + margin;
            const cy = (gradientUnit * gradient.cy) + margin;
            const r = gradient.r - marginPer;
            parameters.push(`cx="${cx}"`, `cy="${cy}"`, `r="${r}%"`);
        }
        const percentages = gradient.percentages || gradient.colors.map((_, index, array) => (index / (array.length - 1)) * 100);
        const colors = gradient.colors.map((color, index) => {
            const offset = percentages[index] || (index / (gradient.colors.length - 1)) * 100;
            return `<stop offset="${offset}%" stop-color="${color}" />`;
        });
        return `<${type} id="${id}" ${parameters.join(' ')} gradientUnits="userSpaceOnUse">${colors.join('')}</${type}>`;
    }
    /**
     * Calculate the position of the border of the gradient
     * @param size Size of the gradient
     * @param angle Angle of the gradient
     * @returns Position of the border
     */
    private static calculateBorderPosition(size: number, angle: number): { x: number, y: number } {
        const radians = angle * Math.PI / 180;
        const xPrime = Math.cos(radians);
        const yPrime = Math.sin(radians);
        const k = (size / 2) / Math.max(Math.abs(xPrime), Math.abs(yPrime));
        const x = k * xPrime;
        const y = k * yPrime;
        return { x, y };
    }
    /**
     * Draw the styles of the QR code
     * @returns SVG styles
     */
    public static drawStyles(style: Style) {
        const svgStyles = [
            `#active-modules { fill: url(#active-gradient); }`,
            `#inactive-modules { fill: url(#inactive-gradient); }`,
            `#background { fill: url(#background-gradient); }`,
        ].join('');
        const svGradients = [
            Style.generateGradient('active-gradient', style.activeColor, style.totalSize, style.margin),
            Style.generateGradient('inactive-gradient', style.inactiveColor, style.totalSize, style.margin),
            Style.generateGradient('background-gradient', style.background, style.totalSize, style.margin),
        ].join('\n');
        const svgContent = [
            `<style>${svgStyles}</style>`,
            `<defs>${svGradients}</defs>`
        ];
        return svgContent.join('\n');
    }
}

export namespace Style {
    export type color = `#${string}`;
    export type SizeValue = number | `${number}%` | `${number}px`;
    export type ColorValue = `#${string}`;
    export interface Styles {
        moduleRadius?: number;
        moduleMargin?: number;
        padding?: number;
        margin?: number;
        background?: color | gradientOptions;
        activeColor?: color | gradientOptions;
        inactiveColor?: color | gradientOptions;
    }
    export namespace Gradient {
        export interface Options {
            type?: 'linear' | 'radial',
            /** Array of colors in Hex format */
            colors: color[],
            /** Array of percentages 0-100 */
            percentages?: number[],
        }
        export interface LinearOptions extends Options {
            type: 'linear',
            /** value 0-365 default 0 */
            direction?: number,
        }
        export interface RadialOptions extends Options {
            type: 'radial',
            /** value 0-100 default 50 */
            cx?: number,
            /** value 0-100 default 50 */
            cy?: number,
            /** value 0-100 default 50 */
            r?: number,
        }
    }
    export type gradientOptions = Gradient.LinearOptions | Gradient.RadialOptions;
    export type gradient = Required<gradientOptions>;
}

export default Style;