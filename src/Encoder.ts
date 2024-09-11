import ReedSolomon from './ReedSolomon.js';
import Info from './Info.js';
import QR from './QR.js';

export class Encoder {
    /** Regular expression to check if a string is numeric */
    private static readonly numericExp = /^\d*$/;
    /** Regular expression to check if a string is alphanumeric */
    private static readonly alphanumericExp = /^[\dA-Z $%*+\-./:]*$/;
    /** Padding for binary data: 11101100 - EC in hex */
    private static readonly PAD1 = '11101100';
    /** Padding for binary data: 00010001 - SE in hex */
    private static readonly PAD0 = '00010001';

    /**
     * Create a new QR data encoder
     * @param version Version of the QR code
     * @param eccLevel Error correction level
     * @throws Error if the version is not supported
     */
    public constructor(
        public readonly version: QR.Version,
        public readonly eccLevel: QR.CorrectionLevel
    ) {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        if (!QR.isSupportedEccLevel(eccLevel)) throw new Error('unsupported ecc level');
    }
    
    /**
     * Get the block sizes for the ecc blocks
     * @returns Array of block sizes
     */
    private get eccBlockSizes() {
        const versionInfo = Info[this.version];
        const eccCodeWords = versionInfo.errorCorrection[this.eccLevel].codewords;
        const totalBlocks = this.totalBlocks;
        return Encoder.calculateBlockSizes(eccCodeWords, totalBlocks);
    }
    /**
     * Get the block sizes for the data blocks
     * @returns Array of block sizes
     */
    private get dataBlockSizes() {
        const versionInfo = Info[this.version];
        const totalCodewords = versionInfo.capacity[this.eccLevel].codewords
        const totalBlocks = this.totalBlocks;
        return Encoder.calculateBlockSizes(totalCodewords, totalBlocks);
    }
    /**
     * Get the total number of blocks
     * @returns Total number of blocks
     */
    private get totalBlocks() {
        const versionInfo = Info[this.version];
        const eccInfo = versionInfo.errorCorrection[this.eccLevel];
        return eccInfo.blocks;
    }
    /**
     * Get the capacity of the data bits
     * @returns Capacity of the data bits
     */
    private get dataBitsCapacity() {
        const versionInfo = Info[this.version];
        return versionInfo.capacity[this.eccLevel].codewords * 8;
    }
    /**
     * Get the capacity of the ecc bits
     * @returns Capacity of the ecc bits
     */
    private get eccBitsCapacity() {
        const versionInfo = Info[this.version];
        return versionInfo.capacity[this.eccLevel].codewords * 8;
    }
    /**
     * Get the total capacity of the QR code in bits
     * @returns Total capacity of the QR code in bits
     */
    private get totalCapacity() {
        return this.dataBitsCapacity + this.eccBitsCapacity;
    }
    /**
     * Encode the data for the QR code
     * @param data Data to encode
     * @returns Encoded data
     * @example
     *  const encoder = new Encoder(1, 'L');
     *  const encoded = encoder.encode('Hello World!');
     *  console.log(encoded);
     */
    public encode(data: string): string {
        const mode = Encoder.detectMode(data);
        const maxDataCapacity = Encoder.getCapacity(this.version, this.eccLevel, mode)
        if (data.length > maxDataCapacity) {
            throw new Error(
                'data is too long for ' +
                `version ${this.version}, ecc level ${this.eccLevel} and mode ${mode}` +
                `\nmax length: ${maxDataCapacity}, given length: ${data.length}`
            );
        }
        let dataEencoded: string;
        let totalSize: number = 0;
        switch (mode) {
            case 'numeric': dataEencoded = this.numeric(data); break;
            case 'alphanumeric': dataEencoded = this.alphanumeric(data); break;
            case 'binary': dataEencoded = this.binary(data); break;
            default: throw new Error(`Unsupported mode: ${mode}`);
        }
        totalSize += dataEencoded.length;

        const modeIndicator = this.getModeIndicator(mode);
        totalSize += modeIndicator.length;
        const Count = this.getBitCount(data.length, mode);
        totalSize += Count.length;
        const terminator = '0000';
        totalSize += terminator.length;
        const bitPadding = this.getBitPadding(totalSize);
        totalSize += bitPadding.length;
        const bytePadding = this.getBytePadding(totalSize);
        totalSize += bytePadding.length;
        const encoded = (
            modeIndicator + Count +
            dataEencoded + terminator +
            bitPadding + bytePadding
        );
        // console.log('encoded', encoded.length / 8, encoded);

        const dataCodewords = this.bitsToCodewords(encoded);
        
        const dataBlockSizes = this.dataBlockSizes;
        const eccBlockSizes = this.eccBlockSizes;
        const dataBlocks = this.divideInBlocks(dataCodewords, dataBlockSizes);
        const eccBlocks = dataBlocks.map((codeWords, index) => {
            return ReedSolomon.calculateSyndromes(codeWords, eccBlockSizes[index]);
        });
        
        const finalCodewords = this.interleaveCodewords(dataBlocks, eccBlocks);

        // console.log('mode', modeIndicator.length, modeIndicator);
        // console.log('Count', Count.length, Count);
        // console.log('data', dataEencoded.length, dataEencoded);
        // console.log('terminator', terminator.length, terminator);
        // console.log('bit padding', bitPadding.length, bitPadding);
        // console.log('padding', bytePadding.length, bytePadding);
        // console.log('total', totalSize, 'bits');
        for (const block of dataBlocks) {
            // console.log("data block: ", block.length, block.map(x => x.toString(16).padStart(2, '0')).join(', '));
        }
        for (const block of eccBlocks) {
            // console.log("ecc block: ", block.length, block.map(x => x.toString(16).padStart(2, '0')).join(', '));
        }
        return finalCodewords.map(x => x.toString(2).padStart(8, '0')).join('');
    }
    /**
     * Divide an array of numbers in blocks of a given size
     * @param data Array of numbers
     * @param sizes Array of block sizes
     * @returns Array of blocks
     */
    private divideInBlocks(data: number[], sizes: number[]): number[][] {
        const blocks = []; let index = 0;
        for (const size of sizes) {
            blocks.push(data.slice(index, index + size));
            index += size;
        }
        return blocks;
    }
    /**
     * Interleave the data blocks and the ecc blocks
     * @param data Array of data blocks
     * @param ec Array of ecc blocks
     * @returns Interleaved array
     */
    private interleaveCodewords(data: number[][], ec: number[][]): number[] {
        const result = [];
        const maxDataLength = Math.max(...data.map(block => block.length));
        for (let dataIndex = 0; dataIndex < maxDataLength; dataIndex++) {
            for (let blockIndex = 0; blockIndex < data.length; blockIndex++) {
                if (dataIndex < data[blockIndex].length) {
                    result.push(data[blockIndex][dataIndex]);
                }
            }
        }
        const maxEcLength = Math.max(...ec.map(block => block.length));
        for (let ecIndex = 0; ecIndex < maxEcLength; ecIndex++) {
            for (let blockIndex = 0; blockIndex < ec.length; blockIndex++) {
                if (ecIndex < ec[blockIndex].length) {
                    result.push(ec[blockIndex][ecIndex]);
                }
            }
        }
        return result;
    }
    /**
     * Get the mode indicator for the data
     * @param mode Mode of the data
     * @returns Mode indicator
     */
    private getModeIndicator(mode: Encoder.Mode): string {
        switch (mode) {
            case 'numeric':      return '0001';
            case 'alphanumeric': return '0010';
            case 'binary':         return '0100';
            default: throw new Error(`Unsupported mode: ${mode}`);
        }
    }
    /**
     * Get the bit count for the data
     * @param length Length of the data
     * @param mode Mode of the data
     * @returns Bit count
     */
    private getBitCount(length: number, mode: Encoder.Mode): string {
        let bitLength = 0;
        switch (mode) {
            case 'numeric':      bitLength = this.version < 10 ? 10 : this.version < 27 ? 12 : 14; break;
            case 'alphanumeric': bitLength = this.version < 10 ? 9 :  this.version < 27 ? 11 : 13; break;
            case 'binary':         bitLength = this.version < 10 ? 8 :  this.version < 27 ? 16 : 16; break;
        }
        return length.toString(2).padStart(bitLength, '0');
    }
    /**
     * Get the bit padding for complete the last byte of the data
     * @param dataBitSize Size of the data in bits
     * @returns Bit padding
     * @example
     *  getBitPadding(22) => '00' // cause 22 bits are used and 2 are missing
     *  getBitPadding(36) => '0000' // cause 36 bits are used and 4 are missing
     */
    private getBitPadding(dataBitSize: number): string {
        let padding = '';
        while ((dataBitSize + padding.length) % 8 !== 0) padding += '0';
        return padding;
    }
    /**
     * Get the byte padding for complete the data
     * @param dataSize Size of the data
     * @returns Byte padding
     */
    private getBytePadding(dataSize: number): string {
        const capacity = this.dataBitsCapacity;
        const paddingSize = capacity - dataSize;
        let padding = '';
        while ((dataSize + padding.length) < capacity) {
            padding += (padding.length) % 16 !== 0 ? Encoder.PAD0 : Encoder.PAD1;
        }
        return padding.substring(0, paddingSize);
    }
    /**
     * Convert a string to a binary string using numeric encoding
     * @param data String to convert
     * @returns Binary string
     */
    private numeric(data: string): string {
        let encoded = '';
        for (let i = 0; i < data.length; i += 3) {
            const block = data.substring(i, i + 3);
            const number = parseInt(block);
            const bitLength = block.length === 3 ? 10 : block.length === 2 ? 7 : 4;
            encoded += number.toString(2).padStart(bitLength, '0');
        }
        return encoded;
    }
    /**
     * Convert a string to a binary string using alphanumeric encoding
     * @param data String to convert
     * @returns Binary string
     */
    private alphanumeric(data: string): string {
        const charMap = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
        let encoded = '';
        for (let i = 0; i < data.length; i += 2) {
            const firstChar = charMap.indexOf(data[i]);
            const lastChar = (i + 1) < data.length ? charMap.indexOf(data[i + 1]) : null;
            const value = lastChar === null ? firstChar : firstChar * 45 + lastChar;
            const bitLength = lastChar === null ? 6 : 11;
            encoded += value.toString(2).padStart(bitLength, '0');
        }
        return encoded;
    }
    /**
     * Convert a string to a binary string using UTF-8 encoding
     * @param data String to convert
     * @returns Binary string
     */
    private binary(data: string): string {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        let encoded = '';
        for (const byte of bytes) {
            encoded += byte.toString(2).padStart(8, '0');
        }
        return encoded;
    }
    /**
     * Convert a string of bits to an array of codewords
     * @param bits String of bits
     * @param size Size of each codeword
     * @returns Array of codewords
     */
    private bitsToCodewords(bits: string, size = 8): number[] {
        const codewords = [];
        for (let i = 0; i < bits.length; i += size) {
            const byteStr = bits.substring(i, i + size).padStart(size, '0');
            const byte = parseInt(byteStr, 2);
            codewords.push(byte);
        }
        return codewords;
    }
    
    /**
     * auxiliar method to calculate block sizes
     * @param totalCodewords Total number of codewords
     * @param totalBlocks Total number of blocks
     * @returns Array of block sizes
    */
    private static calculateBlockSizes(totalCodewords: number, totalBlocks: number): number[] {
        const blocksSize = Math.floor(totalCodewords / totalBlocks);
        const remainder = totalCodewords % totalBlocks;
        const blocks = new Array(totalBlocks).fill(blocksSize);
        for (let i = blocks.length - 1; i >= blocks.length - remainder; i--) {
            blocks[i]++;
        }
        return blocks;
    }
    /**
     * Detect the mode of the data
     * @param data Data to encode
     * @returns Mode of the data
     */
    public static detectMode(data: string): Encoder.Mode {
        if (Encoder.numericExp.test(data)) return 'numeric';
        else if (Encoder.alphanumericExp.test(data)) return 'alphanumeric';
        else return 'binary';
    }
    /**
     * Get the capacity of the QR code
     * @param version Version of the QR code
     * @param eccLevel Error correction level
     * @param mode Mode of the data
     * @returns Capacity of the QR code
     * @throws Error if the version is not supported
     */
    public static getCapacity(version: number, eccLevel: QR.CorrectionLevel, mode: Encoder.Mode) {
        if (!QR.isSupportedVersion(version)) throw new Error('unsupported version');
        if (!QR.isSupportedEccLevel(eccLevel)) throw new Error('unsupported ecc level');
        if (!QR.isSupportedMode(mode)) throw new Error('unsupported mode');
        const versionInfo = Info[version];
        const capacityInfo = versionInfo.capacity[eccLevel];
        const capacity = capacityInfo[mode];
        return capacity;
    }
}

export namespace Encoder {
    export type Mode = 'numeric' | 'alphanumeric' | 'binary';
}

export default Encoder;