import QR from "./QR.js";
import Info from "./Info.js";

export class Matrix {
    /** Masks to apply to the matrix */
    public static readonly MASKS: Matrix.Masks = {
        0: [
            [1, 0],
            [0, 1]
        ],
        1: [
            [1, 1],
            [0, 0]
        ],
        2: [
            [1, 0, 0],
            [1, 0, 0],
            [1, 0, 0]
        ],
        3: [
            [1, 0, 0],
            [0, 0, 1],
            [0, 1, 0]
        ],
        4: [
            [1, 1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        ],
        5: [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 1, 0, 1, 0],
            [1, 0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0, 0]
        ],
        6: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 0, 0, 0],
            [1, 1, 0, 1, 1, 0],
            [1, 0, 1, 0, 1, 0],
            [1, 0, 1, 1, 0, 1],
            [1, 0, 0, 0, 1, 1]
        ],
        7: [
            [1, 0, 1, 0, 1, 0],
            [0, 0, 0, 1, 1, 1],
            [1, 0, 0, 0, 1, 1],
            [0, 1, 0, 1, 0, 1],
            [1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 0, 0]
        ]
    }

    public readonly size: number;
    public readonly matrix: Matrix.MatrixData;

    constructor(
        public readonly version: QR.Version,
        public readonly eccLevel: QR.CorrectionLevel = 'L'
    ) {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        if (!QR.isSupportedEccLevel(eccLevel)) throw new Error('unsupported ecc level');
        this.size = Matrix.getSize(version);
        this.matrix = Matrix.getEmptyMatrix(this.size);
        this.drawPositionPattern();
        this.drawSynchroPattern();
        this.drawAlignmentPattern();
        this.drawVersionInfo();
    }
    /**
     * debug reserved areas
     * @param show show the reserved areas
     */
    public debugReservedAreas(show: boolean = true) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (show) {
                    this.matrix[i][j] = this.isReserved(i, j)
                    ? this.matrix[i][j] === 0 ? -3 : -1
                    : this.matrix[i][j];
                } else {
                    this.matrix[i][j] = this.isReserved(i, j)
                    ? this.matrix[i][j] === -3 ? 0 : 1
                    : this.matrix[i][j];
                }
            }
        }
    }
    /**
     * get the matrix data
     * @returns the matrix data
     */
    public get data(): Matrix.MatrixData {
        return this.matrix;
    }
    /**
     * get the max data to encode
     * @returns the max data to encode
     */
    public get maxBitsData() {
        const versionInfo = Info[this.version];
        return versionInfo.totalCodewords * 8;
    }
    /**
     * get the ecc numeric representation
     * @returns the ecc numeric representation
     */
    private get eccId(): number {
        switch(this.eccLevel) {
            case 'L': return 1;
            case 'M': return 0;
            case 'Q': return 3;
            case 'H': return 2;
        }
    }
    /**
     * apply a mask to the matrix
     * @param option the mask to apply
     */
    public aplyMask(option: Matrix.Mask = 0) {
        option = option in Matrix.MASKS ? option : 0;
        const mask = Matrix.MASKS[option];
        this.drawFormatInfo(this.eccId, option);
        for (let row = 0; row < this.size; row += mask.length) {
            for (let col = 0; col < this.size; col += mask[0].length) {
                for (let mRow = 0; mRow < mask.length; mRow++) {
                    for (let mCol = 0; mCol < mask[0].length; mCol++) {
                        const toAplyRow = row + mRow;
                        const toAplyCol = col + mCol;
                        if (toAplyRow >= this.size || toAplyCol >= this.size) continue;
                        if (!this.isReserved(toAplyRow, toAplyCol)) {
                            this.matrix[toAplyRow][toAplyCol] ^= mask[mRow][mCol];
                        }
                    }
                }
            }
        }
    }
    /**
     * set the data to the matrix
     * @param codedData the data to set
     */
    public setData(codedData: Matrix.Bin[]): void {
        if (codedData.length > this.maxBitsData) throw new Error(`data too long, permited: ${this.maxBitsData}, provided: ${codedData.length}`);
        let row = this.size - 1;
        let col = this.size - 1;
        let direction: 'up' | 'down' = 'up';
        let bitIndex = 0;
        while (col >= 0) {
            for (let i = 0; i < 2; i++) {
                if (!this.isReserved(row, col - i) && bitIndex < codedData.length) {
                    this.matrix[row][col - i] = codedData[bitIndex];
                    bitIndex++;
                }
            }
    
            if (direction === 'up') {
                if (row === 0) {
                    direction = 'down';
                    col -= 2;
                    if (col === 6) col -= 1;
                } else row--;
            } else {
                if (row === this.size - 1) {
                    direction = 'up';
                    col -= 2;
                    if (col === 6) col -= 1;
                } else row++;
            }
        }
    }
    /**
     * check if a position is reserved
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReservedToPosition(row: number, column: number): boolean {
        if (row < 8 && column < 8) return true;
        if (row >= this.size - 8 && column < 8) return true;
        if (row < 8 && column >= this.size - 8) return true;
        return false;
    }
    /**
     * check if a position is reserved to synchro
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReserverToSynchro(row: number, column: number): boolean {
        if (row === 6 && column > 7 && column < this.size - 8) return true;
        if (row > 7 && row < this.size - 8 && column === 6) return true;
        return false;
    }
    /**
     * check if a position is reserved to alignment
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReservedToAlignment(row: number, column: number): boolean {
        const positions = Matrix.getAlignPatterPositions(this.version);
        for (const ap_row of positions) {
            for (const ap_column of positions) {
                if (this.isReservedToPosition(ap_row, ap_column)) continue;
                if (
                    row >= ap_row - 2 && row <= ap_row + 2 &&
                    column >= ap_column - 2 && column <= ap_column + 2
                ) return true;
            }
        }
        return false;
    }
    /**
     * check if a position is reserved to format info
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReservedToFormat(row: number, column: number): boolean {
        if (row === 8 && column <= 8) return true;
        if (row <= 8 && column === 8) return true;
        if (row === 8 && column >= this.size - 8) return true;
        if (row >= this.size - 8 && column === 8) return true;
        return false;
    }
    /**
     * check if a position is reserved to version info
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReservedToVersion(row: number, column: number): boolean {
        if (this.version < 7) return false;
        if (row <= 5 && column >= this.size - 11 && column <= this.size - 9) return true;
        if (row >= this.size - 11 && row <= this.size - 9 && column <= 5) return true;
        return false;
    }
    /**
     * check if a position is reserved
     * @param row the row to check
     * @param column the column to check
     * @returns true if the position is reserved
     */
    private isReserved(row: number, column: number): boolean {
        if (this.isReservedToPosition(row, column)) return true;
        if (this.isReserverToSynchro(row, column)) return true;
        if (this.isReservedToAlignment(row, column)) return true;
        if (this.isReservedToFormat(row, column)) return true;
        if (this.isReservedToVersion(row, column)) return true;
        return false;
    }
    /**
     * draw the format info in the matrix
     */
    private drawFormatInfo(errorCorrectionLevel: number, maskPattern: number): void {
        const formatInfo = Matrix.getFormatInfoBits(errorCorrectionLevel, maskPattern);
        for (let i = 0; i <= 5; i++) {
            this.matrix[8][i] = formatInfo[i];
            this.matrix[i][8] = formatInfo[14 - i];
        }
        this.matrix[8][7] = formatInfo[6];
        this.matrix[7][8] = formatInfo[8];
        this.matrix[8][8] = formatInfo[7];
        for (let i = 0; i <= 7; i++) {
            this.matrix[this.size - 1 - i][8] = formatInfo[i];
            this.matrix[8][this.size - 1 - i] = formatInfo[14 - i];
        }
        /** that module is always 1 */
        this.matrix[this.size - 8][8] = 1;
    }
    /**
     * draw the version info in the matrix
     */
    private drawVersionInfo() {
        if (this.version < 7) return; 
        const versionInfoBits = Matrix.getVersionInfoBits(this.version);
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 3; j++) {
                this.matrix[this.size - 11 + j][i] = versionInfoBits[i * 3 + j];
                this.matrix[i][this.size - 11 + j] = versionInfoBits[i * 3 + j];
            }
        }
    }
    /**
     * draw the synchro pattern in the matrix
     */
    private drawSynchroPattern(): void {
        const start = 7;
        const end = this.size - 7;
        let draw: boolean = false;
        for (let i = start; i < end; i++) {
            this.matrix[i][start - 1] = draw ? 1 : 0;
            this.matrix[start - 1][i] = draw ? 1 : 0;
            draw = !draw;
        }
    }
    /**
     * draw the alignment pattern in the matrix
     */
    private drawAlignmentPattern(): void {
        const alignmentPattern: Matrix.MatrixData = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ];
        const positions = Matrix.getAlignPatterPositions(this.version);
        for (const row of positions) {
            for (const column of positions) {
                if (this.isReservedToPosition(row, column)) continue;
                this.draw(alignmentPattern, row - 2, column - 2);
            }
        }
    }
    /**
     * draw the position pattern in the matrix
     */
    private drawPositionPattern(): void {
        const positionPattern: Matrix.MatrixData = [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1],
        ];
        this.draw(positionPattern, 0, 0);
        this.draw(positionPattern, 0, this.size - 7);
        this.draw(positionPattern, this.size - 7, 0);
    }
    /**
     * draw a figure in the matrix
     * @param figure the figure to draw
     * @param row the row to draw the figure
     * @param column the column to draw the figure
     */
    private draw(figure: Matrix.MatrixData, row: number, column: number): void {
        let currentCol = column;
        let currentRow = row;
        for (const row of figure) {
            for (const bit of row) {
                this.matrix[currentRow][currentCol] = bit;
                currentCol++;
            }
            currentRow++; currentCol = column;
        }
    }
    /**
     * Convert the matrix to a string to show a QR preview in console
     */
    public toString() {
        const blackStyle = "border-radius: 0%;color: white; background-color: black; padding: 0;";
        const whiteStyle = "border-radius: 0%;color: black; background-color: white; padding: 0;";
        const testStyle  = "border-radius: 0%;color: white; background-color: red; padding: 0;";
        
        let result = '';
        const styles = [];
        for (const row of this.matrix) {
            for (const bit of row) {
                result += `%c  `;
                styles.push(bit == -1 ? testStyle : bit ? blackStyle : whiteStyle);
            }
            result += '\n';
        }
        console.log(result, ...styles);
    }
    /**
     * generate an empty matrix
     * @param size the size of the matrix
     * @returns the generated matrix
     */
    private static getEmptyMatrix(size: number): Matrix.MatrixData {
        const matrix: Matrix.MatrixData = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = new Array(size).fill(0);
        }
        return matrix;
    }
    /**
     * generate the format info bits
     * @param eccLevel the error correction level
     * @param mask the mask pattern
     * @returns the format info bits
     */
    private static getFormatInfoBits(eccLevel: number, mask: number): Matrix.Bin[] {
        let formatBits = (eccLevel << 3) | mask;
        let formatInfo = formatBits << 10;
        const generator = 0b10100110111;
        for (let i = 4; i >= 0; i--) {
            if ((formatInfo >> (i + 10)) & 1) {
                formatInfo ^= generator << i;
            }
        }
        formatInfo = ((formatBits << 10) | formatInfo) ^ 0b101010000010010;
        return Array.from({ length: 15 }, (_, i) => (formatInfo >> i) & 1).reverse()  as Matrix.Bin[];
    }
    /**
     * generate the version info bits
     * @param version the version of the QR code
     * @returns the version info bits
     */
    private static getVersionInfoBits(version: number): Matrix.Bin[] {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        let versionBits = version << 12;
        const generator = 0b1111100100101;
        for (let i = 5; i >= 0; i--) {
            if ((versionBits >> (i + 12)) & 1) {
                versionBits ^= generator << i;
            }
        }
        versionBits = (version << 12) | versionBits;
        return Array.from({ length: 18 }, (_, i) => (versionBits >> i) & 1) as Matrix.Bin[];
    }
    
    /**
     * get the positions of the alignment patterns
     * @returns the positions of the alignment patterns
     */
    private static getAlignPatterPositions(version: number): number[] {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        const size = Matrix.getSize(version);
        if (version < 2) return [];
        const positions = [6];
        const quantity = Math.floor((version) / 7) + 2;
        const step = Math.floor((size - 13) / (quantity - 1));
        for (let i = 1; i < quantity - 1; i++) {
            positions.push(6 + i * step);
        }
        positions.push(size - 7);
        return positions;
    }
    public static getSize(version: number): number {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        const size = 17 + 4 * version;
        return size;
    }
}

export namespace Matrix {
    export type Mask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    export type Masks = {
        [key in Mask]: Matrix.MatrixData;
    }
    // export type Bin = 0 | 1;
    export type Bin = number;
    export type MatrixData = Bin[][];
}

export default Matrix;