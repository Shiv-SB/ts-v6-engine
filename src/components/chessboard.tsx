import React, { useState, useEffect, useCallback } from 'react';
import './chessboard.css';
import { Bit64 } from '@/utils/utils';


type PieceTypes =
    | 'Rook'
    | 'Knight'
    | 'Bishop'
    | 'Queen'
    | 'King'
    | 'Pawn';


interface Piece {
    label: string;
    type: PieceTypes;
    color: 'white' | 'black';
    value: number; // Add a value to represent the piece
}


interface SquareProps {
    index: number;
    piece: Piece | null;
    isLight: boolean;
    isHighlighted: boolean;
    onDrop: (index: number, event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragStart: (index: number) => void;
}


interface PieceProps {
    piece: Piece;
    index: number;
    onDragStart: (
        event: React.DragEvent<HTMLDivElement>,
        index: number
    ) => void;
}


const PieceComponent: React.FC<PieceProps> = ({
    piece,
    index,
    onDragStart,
}) => {
    const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
        onDragStart(event, index);
    };


    return (
        <div
            className={`piece ${piece.color}`}
            draggable
            onDragStart={handleDragStart}
        >
            {piece.label}
        </div>
    );
};


const Square: React.FC<SquareProps> = ({
    index,
    piece,
    isLight,
    isHighlighted,
    onDrop,
    onDragOver,
    onDragStart,
}) => {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        onDrop(index, event);
    };


    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        onDragOver(event);
    };


    const handleDragStart = () => {
        onDragStart(index);
    };


    return (
        <div
            className={`square ${isLight ? 'light' : 'dark'} ${isHighlighted ? 'highlighted' : ''
                }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
        >
            {piece && (
                <PieceComponent
                    piece={piece}
                    index={index}
                    onDragStart={(event, index) => {
                        event.dataTransfer.setData('index', index.toString());
                    }}
                />
            )}
        </div>
    );
};


const Chessboard: React.FC = () => {
    const [piecePositions, setPiecePositions] = useState<(Piece | null)[]>(
        Array(64).fill(null)
    );
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);
    const [draggedPieceIndex, setDraggedPieceIndex] = useState<number | null>(
        null
    );


    // Piece value assignments - keep this outside to prevent recreation
    const pieceValues = {
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


    // Initialize the board with the standard chess setup
    // Could maybe do 960 init too
    const initializeBoard = useCallback(() => {
        const initialBoard: (Piece | null)[] = Array(64).fill(null);


        const setPiece = (
            index: number,
            type: PieceTypes,
            label: string,
            color: 'white' | 'black'
        ) => {
            const pieceValue = pieceValues[color][type];
            initialBoard[index] = { type, color, label, value: pieceValue };
        };


        // White pieces
        setPiece(0, 'Rook', '\u2656', 'white');
        setPiece(1, 'Knight', '\u2658', 'white');
        setPiece(2, 'Bishop', '\u2657', 'white');
        setPiece(3, 'Queen', '\u2655', 'white');
        setPiece(4, 'King', '\u2654', 'white');
        setPiece(5, 'Bishop', '\u2657', 'white');
        setPiece(6, 'Knight', '\u2658', 'white');
        setPiece(7, 'Rook', '\u2656', 'white');


        for (let i = 8; i < 16; i++) {
            setPiece(i, 'Pawn', '\u2659', 'white');
        }


        // Black pieces
        setPiece(56, 'Rook', '\u265C', 'black');
        setPiece(57, 'Knight', '\u265E', 'black');
        setPiece(58, 'Bishop', '\u265D', 'black');
        setPiece(59, 'Queen', '\u265B', 'black');
        setPiece(60, 'King', '\u265A', 'black');
        setPiece(61, 'Bishop', '\u265D', 'black');
        setPiece(62, 'Knight', '\u265E', 'black');
        setPiece(63, 'Rook', '\u265C', 'black');


        for (let i = 48; i < 56; i++) {
            setPiece(i, 'Pawn', '\u265F', 'black');
        }


        setPiecePositions(initialBoard);
    }, []);


    useEffect(() => {
        initializeBoard();
    }, [initializeBoard]);


    const isPathClear = (
        start: number,
        end: number,
        pieceType: PieceTypes
    ): boolean => {
        if (pieceType === 'Knight') {
            // Knights can jump over pieces
            return true;
        }


        const rowStart = Math.floor(start / 8);
        const colStart = start % 8;
        const rowEnd = Math.floor(end / 8);
        const colEnd = end % 8;


        if (rowStart === rowEnd) {
            // Horizontal movement
            const startCol = Math.min(colStart, colEnd);
            const endCol = Math.max(colStart, colEnd);
            for (let i = startCol + 1; i < endCol; i++) {
                if (piecePositions[rowStart * 8 + i] !== null) {
                    return false; // Piece in the way
                }
            }
        } else if (colStart === colEnd) {
            // Vertical movement
            const startRow = Math.min(rowStart, rowEnd);
            const endRow = Math.max(rowStart, rowEnd);
            for (let i = startRow + 1; i < endRow; i++) {
                if (piecePositions[i * 8 + colStart] !== null) {
                    return false; // Piece in the way
                }
            }
        } else if (Math.abs(rowStart - rowEnd) === Math.abs(colStart - colEnd)) {
            // Diagonal movement
            const rowDir = rowEnd > rowStart ? 1 : -1;
            const colDir = colEnd > colStart ? 1 : -1;
            let row = rowStart + rowDir;
            let col = colStart + colDir;


            while (row !== rowEnd) {
                if (piecePositions[row * 8 + col] !== null) {
                    return false; // Piece in the way
                }
                row += rowDir;
                col += colDir;
            }
        }


        return true; // Path is clear
    };


    const isValidMove = (
        dragIndex: number,
        dropIndex: number,
        piece: Piece
    ): boolean => {
        const rowDiff = Math.abs(Math.floor(dropIndex / 8) - Math.floor(dragIndex / 8));
        const colDiff = Math.abs((dropIndex % 8) - (dragIndex % 8));


        if (
            piecePositions[dropIndex] &&
            piecePositions[dropIndex]!.color === piece.color
        ) {
            return false; // Cannot move onto a piece of the same color
        }


        if (!isPathClear(dragIndex, dropIndex, piece.type)) {
            return false; // Path is blocked
        }


        switch (piece.type) {
            case 'Pawn':
                // Need to figure out en passant
                if (piece.color === 'white') {
                    if (dragIndex >= 8 && dragIndex <= 15) {
                        return (
                            dropIndex === dragIndex + 8 || dropIndex === dragIndex + 16
                        );
                    }
                    return dropIndex === dragIndex + 8;
                } else {
                    if (dragIndex >= 48 && dragIndex <= 55) {
                        return (
                            dropIndex === dragIndex - 8 || dropIndex === dragIndex - 16
                        );
                    }
                    return dropIndex === dragIndex - 8;
                }
            case 'Rook':
                return rowDiff === 0 || colDiff === 0;
            case 'Knight':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'Bishop':
                return rowDiff === colDiff;
            case 'Queen':
                return rowDiff === colDiff || rowDiff === 0 || colDiff === 0;
            case 'King':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    };


    const getValidMoves = (index: number, piece: Piece): number[] => {
        const validMoves: number[] = [];
        for (let i = 0; i < 64; i++) {
            if (isValidMove(index, i, piece)) {
                validMoves.push(i);
            }
        }
        return validMoves;
    };


    const handleSquareDragStart = (index: number) => {
        console.log(`Drag start on square: ${index}`);
        if (piecePositions[index]) {
            const validMoves = getValidMoves(index, piecePositions[index]!);
            setHighlightedSquares(validMoves);
            setDraggedPieceIndex(index);
        } else {
            setHighlightedSquares([]);
            setDraggedPieceIndex(null);
        }
    };


    const sendBoardStateToBackend = async (newBoardState: (Piece | null)[]) => {
        function boardStateToInt(boardState: (Piece | null)[]): bigint {
            let outputState = new Bit64();
        
            for (let i = 0; i < boardState.length; i++) {
                const piece = boardState[i];
                let pieceValue = 0;
        
                if (piece) {
                    pieceValue = piece.value;
                }
        
                // Iterate through each of the 4 bits for the piece value
                for (let j = 0; j < 4; j++) {
                    // Calculate the bit index in the Bit64 array
                    const bitIndex = i * 4 + j;
        
                    // Check if the bitIndex is within the valid range
                    if (bitIndex < 64) {
                        // Extract the j-th bit from pieceValue
                        const bit = (pieceValue >> j) & 1;
        
                        // Set the bit in the Bit64 object
                        outputState.setBit(bitIndex, bit);
                    }
                }
            }
        
            console.log('boardStateToInt output: ', outputState.getValue().toString());
            return outputState.getValue();
        }
        

        try {
            const response = await fetch('/api/board/nextmove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    boardState: boardStateToInt(newBoardState).toString(),
                }),
            });


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            const data = await response.json();
            console.log('Board state sent successfully:', data);
            // Handle response from backend here, e.g., update state based on backend response
        } catch (error) {
            console.error('Failed to send board state to backend:', error);
            // Handle error here, e.g., display an error message to the user
        }
    };


    const handlePieceDrop = (
        dropIndex: number,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        const dragIndex = parseInt(
            event.dataTransfer.getData('index'),
            10
        );


        if (isNaN(dragIndex)) {
            return;
        }


        const draggedPiece = piecePositions[dragIndex];


        if (!draggedPiece) {
            return;
        }


        if (!isValidMove(dragIndex, dropIndex, draggedPiece)) {
            return;
        }


        const newBoardState = [...piecePositions];
        newBoardState[dropIndex] = draggedPiece;
        newBoardState[dragIndex] = null;
        setPiecePositions(newBoardState);
        setHighlightedSquares([]); // Clear highlighting after the move
        // Send the new board state to the backend
        sendBoardStateToBackend(newBoardState);
    };


    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };


    const renderBoard = () => {
        const board = [];
        for (let i = 0; i < 64; i++) {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLight = (row + col) % 2 === 0;
            const isHighlighted = highlightedSquares.includes(i);


            board.push(
                <Square
                    key={i}
                    index={i}
                    piece={piecePositions[i]}
                    isLight={isLight}
                    isHighlighted={isHighlighted}
                    onDrop={handlePieceDrop}
                    onDragOver={handleDragOver}
                    onDragStart={handleSquareDragStart}
                />
            );
        }
        console.info('Rendering board...');
        return board;
    };


    const handleNewGame = () => {
        initializeBoard();
        setHighlightedSquares([]);
    };


    const handleColorChange = (color: 'white' | 'black') => {
        setPlayerColor(color);
    };


    return (
        <div className="chessboard-container">
            <h1>placeholder</h1>
            <div className="controls">
                <button onClick={handleNewGame}>New Game</button>
                <div>
                    Play as:
                    <button
                        onClick={() => handleColorChange('white')}
                        disabled={playerColor === 'white'}
                    >
                        White
                    </button>
                    <button
                        onClick={() => handleColorChange('black')}
                        disabled={playerColor === 'black'}
                    >
                        Black
                    </button>
                </div>
            </div>
            <div className="chessboard">{renderBoard()}</div>
        </div>
    );
};


export default Chessboard;
