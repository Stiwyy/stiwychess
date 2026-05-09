export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Piece {
    type: PieceType;
    color: Color;
}

export type SquareState = Piece | null;
export type Boardstate = SquareState[][];