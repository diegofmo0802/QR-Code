import Encoder from "./Encoder.js";
import Matrix from "./Matrix.js";
import Info from "./Info.js";
import Drawer from "./Drawer.js";

export class QR {
    private readonly matrix: Matrix;
    public readonly version: QR.Version;
    public readonly eccLevel: QR.CorrectionLevel;
    private readonly mask: Matrix.Mask;
    private _debugMode: boolean = false;
    /**
     * Create a new QR code
     * @param content Content to encode
     * @param options Options
     * @example
     *  const qr = new QR('Hello World!', { eccLevel: 'L', mask: 5 });
     *  qr.debugMode = true;
     *  qr.addImage('https://example.com/image.png');
     *  const source = qr.dataUrl;
     *  const img = new Image();
     *  img.src = source;
     *  document.body.appendChild(img);
     */
    public constructor(
        private readonly content: string,
        options: QR.options = {}
    ) {
        let { minVersion = 1, eccLevel = 'L', mask = 5, icon = false } = options;

        if (icon) {
            minVersion = minVersion < 2 ? 2 : minVersion;
            eccLevel = ['L', 'M'].includes(eccLevel) ? 'Q': eccLevel;
        }

        if (!QR.isSupportedEccLevel(eccLevel)) {
            throw new Error('unsupported ecc level');
        }
        if (!QR.isSupportedMask(mask)) {
            throw new Error('unsupported mask');
        }
        let version = QR.detectVersion(content, eccLevel);
        version = version > minVersion ? version : minVersion;

        this.eccLevel = eccLevel;
        this.mask = mask;
        this.version = version;

        this.matrix = this.initMatrix(this.version, eccLevel, content);
    }
    /**
     * Initialize the matrix
     * @param version Version of the QR code
     * @param eccLevel Error correction level
     * @param content Content to encode
     * @returns Matrix
     */
    private initMatrix(version: QR.Version, eccLevel: QR.CorrectionLevel, content: string): Matrix {
        const encoder = new Encoder(version, eccLevel);
        const matrix = new Matrix(version, eccLevel);

        const BinString = encoder.encode(content);
        const bits = BinString.split('').map(bit => bit === '1' ? 1 : 0);

        matrix.setData(bits);
        matrix.applyMask(this.mask);
        return matrix
    }
    /**
     * Get the data URL of the QR code
     * @returns Data URL of the QR code if you are in a browser, null otherwise
     */
    public get imageDrawer(): Drawer | null {
        try { return Drawer.create(this); }
        catch { return null; }
    }
    /**
     * Get the QR matrix
     * @returns Matrix
    */
    public get QRMatrix(): Matrix {
        return this.matrix;
    }
    /**
     * Get the size of the QR code
     * @returns Size of the QR code
     */
    public get size(): number {
        return this.matrix.size;
    }
    /**
     * Get the debug mode
     * @returns Debug mode
     */
    public get debugMode(): boolean {
        return this._debugMode;
    }
    /**
     * Set the debug mode
     * @param mode Debug mode
     */
    public set debugMode(mode: boolean) {
        this._debugMode = mode;
        this.matrix.debugReservedAreas(mode);
    }
    /**
     * Detect the version of the QR code
     * @param data Data to encode
     * @param eccLevel Error correction level
     * @returns Version of the QR code
     */
    public static detectVersion(data: string, eccLevel: QR.CorrectionLevel): QR.Version {
        const mode = Encoder.detectMode(data);
        for (const version in Info) {
            const versionNumber = parseInt(version) as QR.Version;
            const capacity = Encoder.getCapacity(versionNumber, eccLevel, mode);
            if (data.length <= capacity) return versionNumber;
        }
        throw new Error('the required version is not supported 😢');
    }
    /**
     * Detect if the mode is supported
     * @param mode Mode to check
     * @returns True if the mode is supported, false otherwise
    */
    public static isSupportedMode(mode: string): mode is Encoder.Mode {
        return ['numeric', 'alphanumeric', 'binary'].includes(mode);
    }
    /**
     * Detect if the ECC level is supported
     * @param level ECC level to check
     * @returns True if the ECC level is supported, false otherwise
     */
    public static isSupportedEccLevel(level: string): level is QR.CorrectionLevel {
        return ['L', 'M', 'Q', 'H'].includes(level);
    }
    /**
     * Detect if the mask is supported
     * @param mask Mask to check
     * @returns True if the mask is supported, false otherwise
     */
    public static isSupportedMask(mask: number): mask is Matrix.Mask {
        return mask in Matrix.MASKS;
    }
    /**
     * Detect if the version is supported
     * @param version Version to check
     * @returns True if the version is supported, false otherwise
     */
    public static isSupportedVersion(version: number): version is QR.Version {
        return version in Info;
    }
}

export namespace QR {
    export interface options {
        minVersion?: Version;
        eccLevel?: CorrectionLevel;
        mask?: Matrix.Mask;
        icon?: boolean;
    }
    export type Version = (
        1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
        11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
        21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
        31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40
    );
    export type CorrectionLevel = 'L' | 'M' | 'Q' | 'H';
}
export { Drawer, Matrix, Encoder };
export default QR;