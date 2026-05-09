export type Color = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface Piece {
    type: PieceType;
    color: Color;
    id: string;
}

export type SquareState = Piece | null;
export type BoardState = SquareState[][];

export const createInitialBoard = (): BoardState => {
    const board: BoardState = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));

    let idCounter = 0;

    const placePiece = (
        row: number,
        col: number,
        type: PieceType,
        color: Color
    ) => {
        board[row][col] = {id: `piece-${idCounter++}`, type, color };
    };

    const backRank: PieceType[] = [
        'rook',
        'knight',
        'bishop',
        'queen',
        'king',
        'bishop',
        'knight',
        'rook',
    ];

    backRank.forEach((piece, col) => {
        placePiece(0, col, piece, 'black');
        placePiece(1, col, 'pawn', 'black');
    });

    backRank.forEach((piece, col) => {
        placePiece(7, col, piece, 'white');
        placePiece(6, col, 'pawn', 'white');
    });

    return board;
};

export interface Position {
    row: number;
    col: number;
}

export interface CastlingRights {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
}

export interface GameState {
    board: BoardState;
    turn: Color;
    castlingRights: CastlingRights;
    enPassantTarget: Position | null;
}
export const createInitialGameState = (): GameState => ({
    board: createInitialBoard(),
    turn: 'white',
    castlingRights: {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
    },
    enPassantTarget: null
});