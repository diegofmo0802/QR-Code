import GF28 from "./GF28.js";

export class ReedSolomon {
    /**
     * Generate a generator polynomial for a given degree
     * @param degree Degree of the generator polynomial
     * @returns Generator polynomial
     */
    public static generateGeneratorPolynomial(degree: number): number[] {
        let generator = [1];
        for (let i = 0; i < degree; i++) {
            generator = GF28.polyMultiply(generator, [1, GF28.exp(i)]);
        }
        return generator;
    }
    /**
     * Calculate the syndromes for a given data and generator polynomial
     * @param data Data to encode
     * @param degree Degree of the generator polynomial
     * @returns Syndromes
     */
    public static calculateSyndromes(data: number[], degree: number): number[] {
        const generator = this.generateGeneratorPolynomial(degree);
        const padding = (new Array(degree)).fill(0);
        const paddedData = [...data, ...padding];
        let offset = 0;
        while (offset < paddedData.length - degree) {
            const leadTerm = paddedData[offset];
            if (leadTerm !== 0) {
                const scaledGenerator = generator.map(g => GF28.multiply(g, leadTerm));
                for (let i = 0; i < generator.length; i++) {
                    paddedData[offset + i] ^= scaledGenerator[i];
                }
            }
            offset++;
        }
        return paddedData.slice(-degree);
    }
}

export default ReedSolomon;