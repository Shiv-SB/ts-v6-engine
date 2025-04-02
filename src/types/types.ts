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
    value: number;
}
