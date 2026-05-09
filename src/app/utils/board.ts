import {GameState, Position, Piece, PieceType, serializeBoard} from "@/app/types/chess";

// helper functions for notation
const getColName = (col: number) => String.fromCharCode('a'.charCodeAt(0) + col);
const getRowName = (row: number) => (8 - row).toString();
const getSquareName = (pos: Position) => `${getColName(pos.col)}${getRowName(pos.row)}`;

// generates notation
const generateSAN = (
    piece: Piece, from: Position, to: Position,
    isCapture: boolean, isCastle: boolean, promotion?: PieceType
): string => {
    if (isCastle) return to.col > from.col ? "O-O" : "O-O-O";

    const pieceLetter = piece.type === 'pawn' ? '' : (piece.type === 'knight' ? 'N' : piece.type.charAt(0).toUpperCase());
    let moveString = pieceLetter;

    if (isCapture) {
        if (piece.type === 'pawn') moveString += getColName(from.col);
        moveString += 'x';
    }

    moveString += getSquareName(to);

    if (promotion) {
        const promoLetter = promotion === 'knight' ? 'N' : promotion.charAt(0).toUpperCase();
        moveString += `=${promoLetter}`;
    }

    return moveString;
};

export const executeMove = (
    state: GameState,
    from: Position,
    to: Position,
    promotion?: PieceType
): GameState => {
    const newBoard = state.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    if (!piece) return state;

    let newEnPassantTarget: Position | null = null;
    const newCastlingRights = JSON.parse(JSON.stringify(state.castlingRights));

    const targetPiece = newBoard[to.row][to.col];
    const isEnPassant = piece.type === 'pawn' && state.enPassantTarget?.row === to.row && state.enPassantTarget?.col === to.col;
    const isCapture = targetPiece !== null || isEnPassant;
    const isCastle = piece.type === 'king' && Math.abs(to.col - from.col) === 2;

    const moveText = generateSAN(piece, from, to, isCapture, isCastle, promotion);

    if (isEnPassant) {
        const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
        newBoard[captureRow][to.col] = null;
    }

    if (isCastle) {
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

    if (promotion) {
        newBoard[to.row][to.col] = { id: piece.id, type: promotion, color: piece.color };
    } else {
        newBoard[to.row][to.col] = piece;
    }
    newBoard[from.row][from.col] = null;

    // Draw Counters
    const isPawnMove = piece.type === 'pawn';
    const newHalfMoveClock = (isPawnMove || isCapture) ? 0 : state.halfMoveClock + 1;
    const newFullMoveNumber = state.turn === 'black' ? state.fullMoveNumber + 1 : state.fullMoveNumber;

    return {
        board: newBoard,
        turn: state.turn === 'white' ? 'black' : 'white',
        castlingRights: newCastlingRights,
        enPassantTarget: newEnPassantTarget,
        halfMoveClock: newHalfMoveClock,
        fullMoveNumber: newFullMoveNumber,
        positionHistory: [...state.positionHistory, serializeBoard(newBoard)],
        moveHistory: [...state.moveHistory, moveText]
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