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
    0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.2, 5: 1.2, 6: 1.2, 7: 1.2,
    8: 1.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 1.2, 13: 1.5, 14: 1.5, 15: 1.5,
    16: 1.2, 17: 1.2, 18: 1.5, 19: 2.0, 20: 2.0, 21: 2.0, 22: 1.5, 23: 1.5,
    24: 1.2, 25: 1.2, 26: 1.2, 27: 1.5, 28: 2.0, 29: 3.0, 30: 3.0, 31: 2.0,
    32: 2.0, 33: 3.0, 34: 3.0, 35: 2.0, 36: 1.5, 37: 2.0, 38: 2.0, 39: 1.5,
    40: 1.5, 41: 2.0, 42: 1.5, 43: 1.2, 44: 1.2, 45: 1.2, 46: 1.0, 47: 1.0,
    48: 1.0, 49: 1.0, 50: 1.0, 51: 1.0, 52: 1.0, 53: 1.0, 54: 1.0, 55: 1.0,
    56: 1.0, 57: 1.0, 58: 1.0, 59: 1.0, 60: 1.0, 61: 1.0, 62: 1.0, 63: 1.0
};

// King's safety map, prefer back ranks for the King
const kingPositionMap: { white: Record<number, number>; black: Record<number, number>; } = {
    white: {
        0: 3.0, 1: 3.0, 2: 3.0, 3: 3.0, 4: 2.5, 5: 2.5, 6: 2.5, 7: 2.5,
        8: 2.0, 9: 2.0, 10: 2.0, 11: 2.0, 12: 2.0, 13: 1.5, 14: 1.5, 15: 1.5,
        16: 1.5, 17: 1.5, 18: 1.5, 19: 1.0, 20: 1.0, 21: 1.0, 22: 1.0, 23: 1.0,
        // ... rest of the squares default to 1.0
    },
    black: {
        56: 3.0, 57: 3.0, 58: 3.0, 59: 3.0, 60: 2.5, 61: 2.5, 62: 2.5, 63: 2.5,
        48: 2.0, 49: 2.0, 50: 2.0, 51: 2.0, 52: 2.0, 53: 1.5, 54: 1.5, 55: 1.5,
        40: 1.5, 41: 1.5, 42: 1.5, 43: 1.0, 44: 1.0, 45: 1.0, 46: 1.0, 47: 1.0,
        // ... rest of the squares default to 1.0
    }
};

// For pawns, we want to increase the value when closer to promotion
const pawnPositionMap: { white: Record<number, number>; black: Record<number, number>; } = {
    white: { 
        8: 1.2, 9: 1.2, 10: 1.2, 11: 1.2, 12: 1.2, 13: 1.5, 14: 1.5, 15: 1.5 
    },
    black: { 
        48: 1.2, 49: 1.2, 50: 1.2, 51: 1.2, 52: 1.2, 53: 1.5, 54: 1.5, 55: 1.5 
    }
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
        return (totalScoreWhite - totalScoreBlack);
    }

    evaluate() {

    }

}

export default Engine;