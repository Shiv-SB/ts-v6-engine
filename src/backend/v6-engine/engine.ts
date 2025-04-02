interface EngineOpts {

}

interface EnginePiece extends Omit<Piece, "label"> {
    score: number;
}

const boardScores = {
    whiteMated: 1000,
    blackMated: -1000,
    draw: 0,
}

const pieceScores: Record<PieceTypes, number> = {
    "Pawn": 1,
    "Knight": 3,
    "Bishop": 3,
    "Rook": 5,
    "Queen": 9,
    "King": 0,
}

const centralityMap: Record<number, number> = {
    0: 1, 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2,
    8: 1, 9: 1, 10: 1, 11: 1, 12: 2, 13: 3, 14: 3, 15: 3,
    16: 2, 17: 2, 18: 3, 19: 4, 20: 4, 21: 4, 22: 3, 23: 3,
    24: 2, 25: 2, 26: 2, 27: 3, 28: 4, 29: 5, 30: 5, 31: 4,
    32: 4, 33: 5, 34: 5, 35: 4, 36: 3, 37: 4, 38: 4, 39: 3,
    40: 3, 41: 4, 42: 3, 43: 2, 44: 2, 45: 2, 46: 1, 47: 1,
    48: 1, 49: 1, 50: 1, 51: 1, 52: 1, 53: 1, 54: 1, 55: 1,
    56: 1, 57: 1, 58: 1, 59: 1, 60: 1, 61: 1, 62: 1, 63: 1
};

// King's safety map, prefer back ranks for the King
const kingPositionMap: { white: Record<number, number>; black: Record<number, number>; } = {
    black: {
        0: 5, 1: 5, 2: 5, 3: 5, 4: 4, 5: 4, 6: 4, 7: 4,
        8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 2, 14: 2, 15: 2,
        16: 2, 17: 2, 18: 2, 19: 1, 20: 1, 21: 1, 22: 1, 23: 1,
        24: 1, 25: 1, 26: 1, 27: 1, 28: 1, 29: 1, 30: 1, 31: 1,
        32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1,
        40: 1, 41: 1, 42: 1, 43: 1, 44: 1, 45: 1, 46: 1, 47: 1,
        48: 1, 49: 1, 50: 1, 51: 1, 52: 1, 53: 1, 54: 1, 55: 1,
        56: 1, 57: 1, 58: 1, 59: 1, 60: 1, 61: 1, 62: 1, 63: 1,
    },
    white: {
        56: 5, 57: 5, 58: 5, 59: 5, 60: 4, 61: 4, 62: 4, 63: 4,
        48: 3, 49: 3, 50: 3, 51: 3, 52: 3, 53: 2, 54: 2, 55: 2,
        40: 2, 41: 2, 42: 2, 43: 2, 44: 2, 45: 1, 46: 1, 47: 1,
        32: 2, 33: 2, 34: 2, 35: 2, 36: 2, 37: 1, 38: 1, 39: 1,
        24: 1, 25: 1, 26: 1, 27: 1, 28: 1, 29: 1, 30: 1, 31: 1,
        16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 23: 1,
        8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1,
    }
};

// For pawns, we want to increase the value when closer to promotion
const pawnPositionMap: { white: Record<number, number>; black: Record<number, number>; } = {
    white: { 48: 2, 49: 2, 50: 2, 51: 2, 52: 2, 53: 3, 54: 3, 55: 3 },
    black: { 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 3, 14: 3, 15: 3 },
};

// 54552569730447871266245735194300595407301025593108897272372046102380951192353

class Engine {

    constructor(opts: EngineOpts) {

    }

    static parseBoardState(boardStateInt: bigint) {

        const pieceValues: {
            white: Record<PieceTypes, number>;
            black: Record<PieceTypes, number>;
        } = {
            white: {
                Rook: 1,
                Knight: 2,
                Bishop: 3,
                Queen: 4,
                King: 5,
                Pawn: 6,
            },
            black: {
                Rook: 7,
                Knight: 8,
                Bishop: 9,
                Queen: 10,
                King: 11,
                Pawn: 12,
            },
        };

        const boardState: (EnginePiece | null)[] = [];
        const pieceTypes: PieceTypes[] = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Pawn'];

        for (let i = 0; i < 64; i++) {
            // Extract the 4 bits for the current piece (encoded in a 4-bit chunk)
            const pieceBits = (BigInt(boardStateInt) >> BigInt(i * 4)) & 0xFn; // Get last 4 bits

            const pieceValue = Number(pieceBits);

            if (pieceValue === 0) {
                boardState.push(null); // No piece on this square
            } else {
                // Determine color and piece type based on piece value
                let color: 'white' | 'black';
                let type: PieceTypes;

                if (pieceValue <= 6) {
                    color = 'white';
                    type = pieceTypes[pieceValue - 1]; // Mapping 1 to 'Rook', 2 to 'Knight', etc.
                } else {
                    color = 'black';
                    type = pieceTypes[pieceValue - 7]; // Mapping 7 to 'Rook', 8 to 'Knight', etc.
                }

                // Create the piece object
                const piece: EnginePiece = {
                    type,
                    color,
                    value: pieceValues[color][type],
                    score: pieceScores[type],
                };

                boardState.push(piece);
            }
        }

        return boardState.reverse(); // Reverse the board state to match chessboard layout
    }

    public static adjustScoreForRelativePosition(index: number, piece: EnginePiece): number {
        let positionMultiplier = 1;

        if (piece.type === 'Knight' || piece.type === 'Bishop') {
            // Centrality bonus for Knights and Bishops
            positionMultiplier = centralityMap[index] || 1;
        } else if (piece.type === 'King') {
            // King's safety score
            positionMultiplier = kingPositionMap[piece.color][index] || 1;
        } else if (piece.type === 'Pawn') {
            // Pawn position map
            positionMultiplier = pawnPositionMap[piece.color][index] || 1;
        }
        return piece.score * positionMultiplier;

    }

    public static calculateTotalPieceScores(boardStateInt: bigint): number {

        const parsedState = Engine.parseBoardState(boardStateInt);

        let totalScoreBlack = 0;
        let totalScoreWhite = 0;

        for (let i = 0; i < parsedState.length; i++) {
            const piece = parsedState[i];
            if (!piece) continue;
            if (piece.color === "black") totalScoreBlack += Engine.adjustScoreForRelativePosition(i, piece);
            if (piece.color === "white") totalScoreWhite += Engine.adjustScoreForRelativePosition(i, piece);
        }
        console.log({ totalScoreBlack, totalScoreWhite });
        return totalScoreWhite - totalScoreBlack;
    }

    evaluate() {

    }

}

export default Engine;