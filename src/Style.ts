export class Style {
    public readonly moduleSize: number;
    public readonly totalSize: number;
    private _moduleRadius: number = 0;
    private _moduleMargin: number = 0;
    private _padding: number = 0;
    private _background: Style.gradient = Style.parseColor('#00B4FF');
    private _activeColor: Style.gradient = Style.parseColor('#000000');
    private _inactiveColor: Style.gradient = Style.parseColor('#FFFFFF');
    public constructor(
        private readonly matrixSideSize: number,
    ) {
        this.moduleSize = 100;
        this.totalSize = matrixSideSize * this.moduleSize;
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
    public static parseColor(color: Style.ColorValue | Style.gradientOptions): Style.gradient {
        if (typeof color === 'string') return {
            type: 'linear',
            colors: [color],
            direction: '0deg',
            percentages: [0, 100],
        };
        if (color.type === 'linear') {
            return {
                type: 'linear',
                colors: color.colors,
                direction: color.direction || '0deg',
                percentages: color.percentages || color.colors.map((_, index, array) => (index / (array.length - 1)) * 100),
            };
        } else {
            return {
                type: 'radial',
                colors: color.colors,
                percentages: color.percentages || color.colors.map((_, index, array) => (index / (array.length - 1)) * 100),
                dx: color.dx || 50,
                dy: color.dy || 50,
                r: color.r || 50,
            };
        }
    }
    private static generateGradient(id: string, gradient: Style.gradient): string {
        const type = gradient.type === 'radial' ? 'radialGradient' : 'linearGradient';
        const direction = gradient.type === 'linear' 
        ? `gradientTransform="rotate(${(gradient).direction || '0deg'})"`
        : '';
        const parameters = gradient.type === 'radial' ? [
            `cx="${gradient.dx}%"`, `cy="${gradient.dy}%"`, `r="${gradient.r}%"`,
        ] : [
            `x1="0%"`, `y1="0%"`, `x2="100%"`, `y2="100%"`,
        ]
        const percentages = gradient.percentages || gradient.colors.map((_, index, array) => (index / (array.length - 1)) * 100);
        console.log(percentages);
        const colors = gradient.colors.map((color, index) => {
            const offset = percentages[index] || (index / (gradient.colors.length - 1)) * 100;
            return `<stop offset="${offset}%" stop-color="${color}" />`;
        });
        return `<${type} id="${id}" ${parameters.join(' ')} ${direction} gradientUnits="userSpaceOnUse">${colors.join('')}</${type}>`;
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
            Style.generateGradient('active-gradient', style.activeColor),
            Style.generateGradient('inactive-gradient', style.inactiveColor),
            Style.generateGradient('background-gradient', style.background),
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
    export namespace Gradient {

        export interface Options {
            type?: 'linear' | 'radial',
            colors: color[],
            percentages?: number[],
        }
        export interface LinearOptions extends Options {
            type: 'linear',
            direction?: `${number}deg`,
        }
        export interface RadialOptions extends Options {
            type: 'radial',
            dx?: number,
            dy?: number,
            r?: number,
        }
    }
    export type gradientOptions = Gradient.LinearOptions | Gradient.RadialOptions;
    export type gradient = Required<gradientOptions>;
}

export default Style;