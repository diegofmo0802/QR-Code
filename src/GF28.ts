export class GF28 {
    /** Precomputed log table for GF(2^8) */
    public static readonly logTable: number[] = new Array(256).fill(0);
    /** Precomputed antilog table for GF(2^8) */
    public static readonly antilogTable: number[] = new Array(256).fill(0);
    /** Precompute log and antilog tables for GF(2^8) */
    static {
        let value = 1;
        for (let i = 0; i < 255; i++) {
            this.antilogTable[i] = value;
            this.logTable[value] = i;
            value <<= 1;
            if (value >= 256) {
                value ^= 0x11D;
            }
        }
        this.antilogTable[255] = this.antilogTable[0];
        this.logTable[0] = 0;
    }

    /** 
     * Multiply two numbers in GF(2^8) 
     * @param a First number
     * @param b Second number
     * @returns Product of the two numbers
    */
    public static multiply(a: number, b: number): number {
        if (a === 0 || b === 0) return 0;
        const logA = this.logTable[a];
        const logB = this.logTable[b];
        return this.antilogTable[(logA + logB) % 255];
    }
    /**
     * Divide two numbers in GF(2^8)
     * @param dividend First number
     * @param divisor Second number
     * @returns Quotient of the two numbers
     */
    public static divide(dividend: number, divisor: number): number {
        if (divisor === 0) throw new Error("Division by zero");
        if (dividend === 0) return 0;
        const logDividend = this.logTable[dividend];
        const logDivisor = this.logTable[divisor];
        return this.antilogTable[(logDividend - logDivisor + 255) % 255];
    }
    /**
     * Exponentiate a number in GF(2^8)
     * @param x Number to exponentiate
     * @returns Exponentiated number
     */
    public static exp(x: number): number {
        return this.antilogTable[x % 255];
    }
    /**
     * Multiply two arrays of numbers in GF(2^8)
     * @param a First array
     * @param b Second array
     * @returns Product of the two arrays
     */
    public static polyMultiply(a: number[], b: number[]): number[] {
        const result = new Array(a.length + b.length - 1).fill(0);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) {
                result[i + j] ^= this.multiply(a[i], b[j]);
            }
        }
        return result;
    }
}
export default GF28;