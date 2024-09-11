export const Info: {
    [key: string]: {
        totalCodewords: number,
        capacity: {
            L: { codewords: number, bits: number, numeric: number, alphanumeric: number, binary: number, kanji: number },
            M: { codewords: number, bits: number, numeric: number, alphanumeric: number, binary: number, kanji: number },
            Q: { codewords: number, bits: number, numeric: number, alphanumeric: number, binary: number, kanji: number },
            H: { codewords: number, bits: number, numeric: number, alphanumeric: number, binary: number, kanji: number }
        },
        errorCorrection: {
            L: { blocks: number, codewords: number },
            M: { blocks: number, codewords: number },
            Q: { blocks: number, codewords: number },
            H: { blocks: number, codewords: number }
        }
    }
} = {
    1: {
        totalCodewords: 26,
        capacity: {
            L: { codewords: 19, bits: 152, numeric: 41, alphanumeric: 25, binary: 17, kanji: 10 },
            M: { codewords: 16, bits: 128, numeric: 34, alphanumeric: 20, binary: 14, kanji: 8 },
            Q: { codewords: 13, bits: 104, numeric: 27, alphanumeric: 16, binary: 11, kanji: 7 },
            H: { codewords: 9, bits: 72, numeric: 17, alphanumeric: 10, binary: 7,   kanji: 4 }
        },
        errorCorrection: {
            L: { codewords: 7, blocks: 1 },
            M: { codewords: 10, blocks: 1 },
            Q: { codewords: 13, blocks: 1 },
            H: { codewords: 17, blocks: 1 }
        }
    },
    2: {
        totalCodewords: 44,
        capacity: {
            L: { codewords: 34, bits: 272, numeric: 77, alphanumeric: 47, binary: 32, kanji: 20 },
            M: { codewords: 28, bits: 224, numeric: 63, alphanumeric: 38, binary: 26, kanji: 16 },
            Q: { codewords: 22, bits: 176, numeric: 48, alphanumeric: 29, binary: 20, kanji: 12 },
            H: { codewords: 16, bits: 128, numeric: 34, alphanumeric: 20, binary: 14, kanji: 8 }
        },
        errorCorrection: {
            L: { codewords: 10, blocks: 1 },
            M: { codewords: 16, blocks: 1 },
            Q: { codewords: 22, blocks: 1 },
            H: { codewords: 28, blocks: 1 }
        }
    },
    3: {
        totalCodewords: 70,
        capacity: {
            L: { codewords: 55, bits: 440, numeric: 127, alphanumeric: 77, binary: 53, kanji: 32 },
            M: { codewords: 44, bits: 352, numeric: 101, alphanumeric: 61, binary: 42, kanji: 26 },
            Q: { codewords: 34, bits: 272, numeric: 77, alphanumeric: 47, binary: 32, kanji: 20 },
            H: { codewords: 26, bits: 208, numeric: 58, alphanumeric: 35, binary: 24, kanji: 15 }
        },
        errorCorrection: {
            L: { codewords: 15, blocks: 1 },
            M: { codewords: 26, blocks: 1 },
            Q: { codewords: 36, blocks: 2 },
            H: { codewords: 44, blocks: 2 }
        }
    },
    4: {
        totalCodewords: 100,
        capacity: {
            L: { codewords: 80, bits: 640, numeric: 187, alphanumeric: 114, binary: 78, kanji: 48 },
            M: { codewords: 64, bits: 512, numeric: 149, alphanumeric: 90, binary: 62, kanji: 38 },
            Q: { codewords: 48, bits: 384, numeric: 111, alphanumeric: 67, binary: 46, kanji: 28 },
            H: { codewords: 36, bits: 288, numeric: 82, alphanumeric: 50, binary: 34, kanji: 21 }
        },
        errorCorrection: {
            L: { codewords: 20, blocks: 1 },
            M: { codewords: 36, blocks: 2 },
            Q: { codewords: 52, blocks: 2 },
            H: { codewords: 64, blocks: 4 }
        }
    },
    5: {
        totalCodewords: 134,
        capacity: {
            L: { codewords: 108, bits: 864, numeric: 255, alphanumeric: 154, binary: 106, kanji: 65 },
            M: { codewords: 86, bits: 688, numeric: 202, alphanumeric: 122, binary: 84, kanji: 52 },
            Q: { codewords: 62, bits: 496, numeric: 144, alphanumeric: 87, binary: 60, kanji: 37 },
            H: { codewords: 46, bits: 368, numeric: 106, alphanumeric: 64, binary: 44, kanji: 27 }
        },
        errorCorrection: {
            L: { codewords: 26, blocks: 1 },
            M: { codewords: 48, blocks: 2 },
            Q: { codewords: 72, blocks: 4 },
            H: { codewords: 88, blocks: 4 }
        }
    },
    6: {
        totalCodewords: 172,
        capacity: {
            L: { codewords: 136, bits: 1088, numeric: 322, alphanumeric: 195, binary: 134, kanji: 82 },
            M: { codewords: 108, bits: 864, numeric: 255, alphanumeric: 154, binary: 106, kanji: 65 },
            Q: { codewords: 76, bits: 608, numeric: 178, alphanumeric: 108, binary: 74, kanji: 45 },
            H: { codewords: 60, bits: 480, numeric: 139, alphanumeric: 84, binary: 58, kanji: 36 }
        },
        errorCorrection: {
            L: { codewords: 36, blocks: 2 },
            M: { codewords: 64, blocks: 4 },
            Q: { codewords: 96, blocks: 4 },
            H: { codewords: 112, blocks: 4 }
        }
    },
    7: {
        totalCodewords: 196,
        capacity: {
            L: {bits: 1248,numeric: 370,alphanumeric: 224,binary: 154,kanji: 95,codewords: 156 },
            M: { codewords: 124, bits: 992, numeric: 293, alphanumeric: 178, binary: 122, kanji: 75 },
            Q: { codewords: 88, bits: 704, numeric: 207, alphanumeric: 125, binary: 86, kanji: 53 },
            H: { codewords: 66, bits: 528, numeric: 154, alphanumeric: 93, binary: 64, kanji: 39 }
        },
        errorCorrection: {
            L: { codewords: 40, blocks: 2 },
            M: { codewords: 72, blocks: 4 },
            Q: { codewords: 108, blocks: 6 },
            H: { codewords: 130, blocks: 5 }
        }
    },
    8: {
        totalCodewords: 242,
        capacity: {
            L: { codewords: 194, bits: 1552, numeric: 461, alphanumeric: 279, binary: 192, kanji: 118 },
            M: { codewords: 154, bits: 1232, numeric: 365, alphanumeric: 221, binary: 152, kanji: 93 },
            Q: { codewords: 110, bits: 880, numeric: 259, alphanumeric: 157, binary: 108, kanji: 66 },
            H: { codewords: 86, bits: 688, numeric: 202, alphanumeric: 122, binary: 84, kanji: 52 }
        },
        errorCorrection: {
            L: { codewords: 48, blocks: 2 },
            M: { codewords: 88, blocks: 4 },
            Q: { codewords: 132, blocks: 6 },
            H: { codewords: 156, blocks: 6 }
        }
    },
    9: {
        totalCodewords: 292,
        capacity: {
            L: { codewords: 232, bits: 1856, numeric: 552, alphanumeric: 335, binary: 230, kanji: 141 },
            M: { codewords: 182, bits: 1456, numeric: 432, alphanumeric: 262, binary: 180, kanji: 111 },
            Q: { codewords: 132, bits: 1056, numeric: 312, alphanumeric: 189, binary: 130, kanji: 80 },
            H: { codewords: 100, bits: 800, numeric: 235, alphanumeric: 143, binary: 98, kanji: 60 }
        },
        errorCorrection: {
            L: { codewords: 60, blocks: 2 },
            M: { codewords: 110, blocks: 5 },
            Q: { codewords: 160, blocks: 8 },
            H: { codewords: 192, blocks: 8 }
        }
    },
    10: {
        totalCodewords: 346,
        capacity: {
            L: { codewords: 274, bits: 2192, numeric: 652, alphanumeric: 395, binary: 271, kanji: 167 },
            M: { codewords: 216, bits: 1728, numeric: 513, alphanumeric: 311, binary: 213, kanji: 131 },
            Q: { codewords: 154, bits: 1232, numeric: 364, alphanumeric: 221, binary: 151, kanji: 93 },
            H: { codewords: 122, bits: 976, numeric: 288, alphanumeric: 174, binary: 119, kanji: 74 }
        },
        errorCorrection: {
            L: { codewords: 72, blocks: 4 },
            M: { codewords: 130, blocks: 5 },
            Q: { codewords: 192, blocks: 8 },
            H: { codewords: 224, blocks: 8 }
        }
    }
};

export default Info;