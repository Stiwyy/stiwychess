import { GameState, Position, Piece } from "@/app/types/chess";

export const executeMove = (
    state: GameState,
    from: Position,
    to: Position
): GameState => {
    const newBoard = state.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    if (!piece) return state;

    let newEnPassantTarget: Position | null = null;
    const newCastlingRights = JSON.parse(JSON.stringify(state.castlingRights));

    if (piece.type === 'pawn' && state.enPassantTarget &&
        to.row === state.enPassantTarget.row && to.col === state.enPassantTarget.col) {
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
        const isKingside = to.col > from.col;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? to.col - 1 : to.col + 1;

        newBoard[to.row][rookToCol] = newBoard[to.row][rookFromCol];
        newBoard[to.row][rookFromCol] = null;
    }
    updateCastlingRights(piece, from, newCastlingRights);

    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
        newEnPassantTarget = { row: from.row + (piece.color === 'white' ? -1 : 1), col: from.col };
    }

    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    return {
        board: newBoard,
        turn: state.turn === 'white' ? 'black' : 'white',
        castlingRights: newCastlingRights,
        enPassantTarget: newEnPassantTarget
    };
};

const updateCastlingRights = (piece: Piece, from: Position, rights: GameState['castlingRights']) => {
    if (piece.type === 'king') {
        rights[piece.color].kingside = false;
        rights[piece.color].queenside = false;
    } else if (piece.type === 'rook') {
        if (from.col === 0) rights[piece.color].queenside = false;
        if (from.col === 7) rights[piece.color].kingside = false;
    }
};