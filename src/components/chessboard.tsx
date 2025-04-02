import React, { useState, useEffect, useCallback } from 'react';
import './chessboard.css';
import EvalBar from './evalBar';
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
            {/* debug */ false && <span style={{ fontSize: "30%", color: "green" }}>{index}</span>}
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
    const [isAiMode, setIsAiMode] = useState<boolean>(false); // New state
    const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white'); // Track current turn
    const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
        white: [],
        black: [],
    }); // Track captured pieces

    const [evaluationScore, setEvaluationScore] = useState<number>(0);

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

        const whoToGoFirst: Piece["color"] = Math.random() < 0.5 ? "white" : "black";

        const setPiece = (
            index: number,
            type: PieceTypes,
            label: string,
            color: 'white' | 'black'
        ) => {
            const pieceValue = pieceValues[color][type];
            initialBoard[index] = { type, color, label, value: pieceValue };
        };

        // Black pieces
        setPiece(0, 'Rook', '\u265C', 'black');
        setPiece(1, 'Knight', '\u265E', 'black');
        setPiece(2, 'Bishop', '\u265D', 'black');
        setPiece(3, 'Queen', '\u265B', 'black');
        setPiece(4, 'King', '\u265A', 'black');
        setPiece(5, 'Bishop', '\u265D', 'black');
        setPiece(6, 'Knight', '\u265E', 'black');
        setPiece(7, 'Rook', '\u265C', 'black');

        for (let i = 8; i < 16; i++) {
            setPiece(i, 'Pawn', '\u265F', 'black');
        }

        // White pieces
        setPiece(56, 'Rook', '\u2656', 'white');
        setPiece(57, 'Knight', '\u2658', 'white');
        setPiece(58, 'Bishop', '\u2657', 'white');
        setPiece(59, 'Queen', '\u2655', 'white');
        setPiece(60, 'King', '\u2654', 'white');
        setPiece(61, 'Bishop', '\u2657', 'white');
        setPiece(62, 'Knight', '\u2658', 'white');
        setPiece(63, 'Rook', '\u2656', 'white');

        for (let i = 48; i < 56; i++) {
            setPiece(i, 'Pawn', '\u2659', 'white');
        }

        setPiecePositions(initialBoard);
        setCapturedPieces({ white: [], black: [] }); // Reset captured pieces on new game
        setCurrentTurn(whoToGoFirst);
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

        if (currentTurn !== piece.color) return false;

        const rowDiff = Math.abs(
            Math.floor(dropIndex / 8) - Math.floor(dragIndex / 8)
        );
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

        // Create a temporary board state to simulate the move
        const tempBoardState = [...piecePositions];
        const pieceToMove = tempBoardState[dragIndex]; // Get the piece that is moving
        tempBoardState[dropIndex] = pieceToMove; // Move the piece
        tempBoardState[dragIndex] = null; // Clear the origin square

        // Function to check if a given color is in check
        const isColorInCheck = (boardState: (Piece | null)[], color: 'white' | 'black'): boolean => {
            // Find the king of the given color
            const kingIndex = boardState.findIndex(
                (p) => p && p.type === 'King' && p.color === color
            );

            if (kingIndex === -1) {
                return false; // King not found (shouldn't happen, but handle it)
            }

            // Check if any opponent's piece can attack the king
            for (let i = 0; i < 64; i++) {
                const attacker = boardState[i];
                if (attacker && attacker.color !== color) {
                    if (isValidMoveHelper(i, kingIndex, attacker, boardState)) { // Use the helper function with the boardState argument
                        return true; // King is under attack
                    }
                }
            }

            return false; // King is not under attack
        };

        // Helper function to check if a move is valid (without recursion)
        const isValidMoveHelper = (dragIndex: number, dropIndex: number, piece: Piece, boardState: (Piece | null)[]): boolean => {
            const rowDiff = Math.abs(
                Math.floor(dropIndex / 8) - Math.floor(dragIndex / 8)
            );
            const colDiff = Math.abs((dropIndex % 8) - (dragIndex % 8));

            if (!isPathClearHelper(dragIndex, dropIndex, piece.type, boardState)) {
                return false; // Path is blocked
            }

            switch (piece.type) {
                case 'Pawn': {
                    const captureDirection = piece.color === 'white' ? -1 : 1; // Direction of capture

                    const isDiagonalCapture =
                        rowDiff === 1 && colDiff === 1 && piecePositions[dropIndex] !== null;

                    const isForwardMove = colDiff === 0 && (dropIndex === dragIndex + captureDirection * 8);
                    const isTwoSquareMove =
                        colDiff === 0 && rowDiff === 2 &&
                        ((piece.color === 'white' && dragIndex >= 48 && dragIndex <= 55) ||
                            (piece.color === 'black' && dragIndex >= 8 && dragIndex <= 15)); // Check for initial two-square move

                    if (isDiagonalCapture) {
                        return true; // Diagonal capture is valid
                    } else if (isForwardMove) {
                        // Check if the square is empty for a forward move
                        return piecePositions[dropIndex] === null;
                    } else if (isTwoSquareMove) {
                        // Ensure path is clear when pawn tries to move 2 squares
                        const intermediateSquareIndex = dragIndex + (captureDirection * 8);
                        return piecePositions[dropIndex] === null && piecePositions[intermediateSquareIndex] === null;
                    } else {
                        return false;
                    }
                }

                case 'Rook':
                    return rowDiff === 0 || colDiff === 0;
                case 'Knight':
                    return (rowDiff === 2 && colDiff === 1) ||
                        (rowDiff === 1 && colDiff === 2);
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
        // Helper function to check if the path is clear (without recursion)
        const isPathClearHelper = (
            start: number,
            end: number,
            pieceType: PieceTypes,
            boardState: (Piece | null)[]
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
                    if (boardState[rowStart * 8 + i] !== null) {
                        return false; // Piece in the way
                    }
                }
            } else if (colStart === colEnd) {
                // Vertical movement
                const startRow = Math.min(rowStart, rowEnd);
                const endRow = Math.max(rowStart, rowEnd);
                for (let i = startRow + 1; i < endRow; i++) {
                    if (boardState[i * 8 + colStart] !== null) {
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
                    if (boardState[row * 8 + col] !== null) {
                        return false; // Piece in the way
                    }
                    row += rowDir;
                    col += colDir;
                }
            }

            return true; // Path is clear
        };

        // After the move, is the current player's king in check?
        if (isColorInCheck(tempBoardState, piece.color)) {
            return false; // Illegal move:  King would be in check after the move
        }

        switch (piece.type) {
            case 'Pawn': {
                const captureDirection = piece.color === 'white' ? -1 : 1; // Direction of capture
                const moveDirection = Math.floor(dropIndex / 8) - Math.floor(dragIndex / 8);

                if ((piece.color === 'white' && moveDirection >= 0) || 
                    (piece.color === 'black' && moveDirection <= 0)) {
                        return false;
                }

                const isDiagonalCapture =
                    rowDiff === 1 && colDiff === 1 && piecePositions[dropIndex] !== null;

                const isForwardMove = colDiff === 0 && rowDiff === 1;
                const isTwoSquareMove =
                    colDiff === 0 && rowDiff === 2 &&
                    ((piece.color === 'white' && dragIndex >= 48 && dragIndex <= 55) ||
                        (piece.color === 'black' && dragIndex >= 8 && dragIndex <= 15)); // Check for initial two-square move

                if (isDiagonalCapture) {
                    return true; // Diagonal capture is valid
                } else if (isForwardMove) {
                    // Check if the square is empty for a forward move
                    return piecePositions[dropIndex] === null;
                } else if (isTwoSquareMove) {
                    // Ensure path is clear when pawn tries to move 2 squares
                    const intermediateSquareIndex = dragIndex + (captureDirection * 8);
                    return piecePositions[dropIndex] === null && piecePositions[intermediateSquareIndex] === null;
                } else {
                    return false;
                }
            }
            case 'Rook':
                return rowDiff === 0 || colDiff === 0;
            case 'Knight':
                return (rowDiff === 2 && colDiff === 1) ||
                    (rowDiff === 1 && colDiff === 2);
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

    const sendBoardStateToBackend = async (
        newBoardState: (Piece | null)[]
    ) => {
        function boardStateToInt(boardState: (Piece | null)[]): bigint {
            let currentValue: bigint = 0n;

            for (let i = 0; i < boardState.length; i++) {
                const piece = boardState[i];
                let pieceValue = 0;

                if (piece) {
                    pieceValue = piece.value;
                }
                currentValue += BigInt(pieceValue) << BigInt(i * 4);
            }

            console.log('boardStateToInt output: ', currentValue.toString());
            return currentValue;
        }

        try {
            const response = await fetch('/api/board/nextmove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    boardState: boardStateToInt(newBoardState).toString(),
                    currentTurn: currentTurn, // Send current turn to backend
                    capturedPieces: capturedPieces, // Send captured pieces to backend
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Board state sent successfully:', data);
            
            setEvaluationScore(data.score);

        } catch (error) {
            console.error('Failed to send board state to backend:', error);
            // Handle error here, e.g., display an error message to the user
        }
    };

    const handlePieceDrop = (
        dropIndex: number,
        event: React.DragEvent<HTMLDivElement>
    ) => {
        const dragIndex = parseInt(event.dataTransfer.getData('index'), 10);

        if (isNaN(dragIndex)) {
            return;
        }

        const draggedPiece = piecePositions[dragIndex];

        if (!draggedPiece) {
            return;
        }

        if (draggedPiece.color !== currentTurn) {
            // Invalid move: not the correct player's turn
            return;
        }

        if (!isValidMove(dragIndex, dropIndex, draggedPiece)) {
            return;
        }

        const newBoardState = [...piecePositions];
        let capturedPiece: Piece | null = null;

        if (newBoardState[dropIndex]) {
            // Capture!
            capturedPiece = newBoardState[dropIndex];
        }

        newBoardState[dropIndex] = draggedPiece;
        newBoardState[dragIndex] = null;

        setPiecePositions(newBoardState);
        setHighlightedSquares([]);

        // Update captured pieces
        if (capturedPiece) {
            setCapturedPieces((prevCapturedPieces) => ({
                ...prevCapturedPieces,
                [currentTurn === 'white' ? 'white' : 'black']: [
                    ...prevCapturedPieces[currentTurn === 'white' ? 'white' : 'black'],
                    capturedPiece!,
                ],
            }));
        }

        // Switch turns
        setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');

        // Send the new board state to the backend ONLY if AI mode is enabled
        if (isAiMode) {
            sendBoardStateToBackend(newBoardState);
        }
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
        return board;

    };

    const handleNewGame = () => {
        initializeBoard();
        setHighlightedSquares([]);
        setEvaluationScore(0);
    };

    const handleColorChange = (color: 'white' | 'black') => {
        setPlayerColor(color);
    };

    const toggleAiMode = () => {
        setIsAiMode(!isAiMode);
    };

    return (
        <div className="chessboard-container">
            <h1>placeholder</h1>
            <div>Current Turn: {currentTurn === 'white' ? 'White' : 'Black'}</div>
            <br></br>
            <div className="controls">
                <button onClick={handleNewGame}>New Game</button>
                <div>
                    Play as:
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={playerColor === 'white'}
                            onChange={() => handleColorChange(playerColor === 'white' ? 'black' : 'white')}
                        />
                        <span className="slider round"></span>
                    </label>
                    {playerColor === 'white' ? 'White' : 'Black'}
                </div>
                <div>
                    AI Mode:
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isAiMode}
                            onChange={toggleAiMode}
                        />
                        <span className="slider round"></span>
                    </label>
                    {isAiMode ? 'Enabled' : 'Disabled'}
                </div>
            </div>
            <div className="game-container">
                <div className="chessboard">{renderBoard()}</div>
                <EvalBar score ={evaluationScore} />
            </div>

            <div className="captured-pieces">
                <div>
                    White Captured:
                    {capturedPieces.white.map((piece, index) => (
                        <span key={index}>{piece.label}</span>
                    ))}
                </div>
                <div>
                    Black Captured:
                    {capturedPieces.black.map((piece, index) => (
                        <span key={index}>{piece.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Chessboard;
