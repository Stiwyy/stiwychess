import {BoardState, Color, GameState, Position} from "@/app/types/chess";

const isWithinBoard = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

// helpoer function for rook bishop and queen
const getSlidingMoves = (board: BoardState, from: Position, color:Color, directions: number[][]): Position[] => {
    const moves: Position[] = [];
    for (const [dRow, dCol] of directions) {
        let currentRow = from.row + dRow;
        let currentCol = from.col + dCol;

        while (isWithinBoard(currentRow, currentCol)) {
            const targetPiece = board[currentRow][currentCol];

            // empty square
            if (!targetPiece) {
                moves.push({row: currentRow, col: currentCol});
            } else {
                // piece of opponent
                if (targetPiece.color !== color) {
                    moves.push({ row: currentRow, col: currentCol });
                }
                // any piece is in the way -> it cant go further
                break;
            }
            currentRow += dRow;
            currentCol += dCol;
        }
    }
    return moves;
};
const getPawnMoves = (board: BoardState, from: Position, color: Color, enPassantTarget: Position | null): Position[] => {
    const moves: Position[] = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Forward moves
    if (isWithinBoard(from.row + direction, from.col) && !board[from.row + direction][from.col]) {
        moves.push({ row: from.row + direction, col: from.col });
        // able to move 2 squares if from start square
        if (from.row === startRow && !board[from.row + direction * 2][from.col]) {
            moves.push({ row: from.row + direction * 2, col: from.col });
        }
    }

    // Captures & En Passant
    for (const dCol of [-1, 1]) {
        const tRow = from.row + direction;
        const tCol = from.col + dCol;
        if (isWithinBoard(tRow, tCol)) {
            const target = board[tRow][tCol];
            const isEnPassant = enPassantTarget?.row === tRow && enPassantTarget?.col === tCol;
            if ((target && target.color !== color) || isEnPassant) {
                moves.push({ row: tRow, col: tCol });
            }
        }
    }
    return moves;
};

const getKingMoves = (state: GameState, from: Position, color: Color, checkCastling: boolean = true): Position[] => {
    const moves: Position[] = [];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    // Normal moves
    for (const [dr, dc] of dirs) {
        const r = from.row + dr, c = from.col + dc;
        if (isWithinBoard(r, c)) {
            const target = state.board[r][c];
            if (!target || target.color !== color) moves.push({ row: r, col: c });
        }
    }

    if (!checkCastling) return moves;

    // Castling
    const rights = state.castlingRights[color];
    const row = color === 'white' ? 7 : 0;

    // Check if king is currently in check
    if (isSquareAttacked(state.board, from, color === 'white' ? 'black' : 'white')) return moves;

    if (rights.kingside && !state.board[row][5] && !state.board[row][6]) {
        if (!isSquareAttacked(state.board, {row, col: 5}, color === 'white' ? 'black' : 'white')) {
            moves.push({ row, col: 6 });
        }
    }
    if (rights.queenside && !state.board[row][1] && !state.board[row][2] && !state.board[row][3]) {
        if (!isSquareAttacked(state.board, {row, col: 3}, color === 'white' ? 'black' : 'white') &&
            !isSquareAttacked(state.board, {row, col: 2}, color === 'white' ? 'black' : 'white')) {
            moves.push({ row, col: 2 });
        }
    }
    return moves;
};

const getKnightMoves = (board: BoardState, from: Position, color: Color): Position[] => {
    const moves: Position[] = [];
    const knightDirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

    for (const [dRow, dCol] of knightDirs) {
        const nRow = from.row + dRow, nCol = from.col + dCol;
        if (isWithinBoard(nRow, nCol)) {
            const target = board[nRow][nCol];
            if (!target || target.color !== color) moves.push({ row: nRow, col: nCol });
        }
    }
    return moves;
};

export const getPseudoLegalMoves = (state: GameState, from: Position, ignoreCastling: boolean = false): Position[] => {
    const piece = state.board[from.row][from.col];
    if (!piece) return [];

    const board = state.board;
    const color = piece.color;

    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    switch (piece.type) {
        case 'pawn': return getPawnMoves(board, from, color, state.enPassantTarget);
        case 'king': return getKingMoves(state, from, color, !ignoreCastling);
        case 'knight': return getKnightMoves(board, from, color);
        case 'bishop': return getSlidingMoves(board, from, color, diagonalDirs);
        case 'rook': return getSlidingMoves(board, from, color, straightDirs);
        case 'queen': return getSlidingMoves(board, from, color, [...straightDirs, ...diagonalDirs]);
    }
    return [];
};


export const getLegalMoves = (state: GameState, from: Position): Position[] => {
    const piece = state.board[from.row][from.col];
    if (!piece) return [];

    const pseudoMoves = getPseudoLegalMoves(state, from);
    const validMoves: Position[] = [];
    const opponentColor = piece.color === 'white' ? 'black' : 'white';

    for (const move of pseudoMoves) {
        // Simulate move using our new executeMove to handle all side effects
        // We create a ghost state to not mutate the real one
        const ghostState: GameState = {
            ...state,
            board: state.board.map(r => [...r]),
            castlingRights: JSON.parse(JSON.stringify(state.castlingRights))
        };

        ghostState.board[move.row][move.col] = ghostState.board[from.row][from.col];
        ghostState.board[from.row][from.col] = null;

        const kingPos = findKing(ghostState.board, piece.color);
        if (kingPos && !isSquareAttacked(ghostState.board, kingPos, opponentColor)) {
            validMoves.push(move);
        }
    }
    return validMoves;
};


export const getGameStateStatus = (state: GameState): 'active' | 'checkmate' | 'stalemate' => {
    const currentPlayer = state.turn;
    const opponent = currentPlayer === 'white' ? 'black' : 'white';

    // Check if current player has ANY legal moves
    let hasMoves = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = state.board[r][c];
            if (piece && piece.color === currentPlayer) {
                if (getLegalMoves(state, { row: r, col: c }).length > 0) {
                    hasMoves = true;
                    break;
                }
            }
        }
        if (hasMoves) break;
    }

    if (hasMoves) return 'active';

    const kingPos = findKing(state.board, currentPlayer);
    if (kingPos && isSquareAttacked(state.board, kingPos, opponent)) {
        return 'checkmate';
    }

    return 'stalemate';
};

const findKing = (board: BoardState, color: Color): Position | null => {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'king' && piece.color === color) {
                return { row: r, col: c };
            }
        }
    }
    return null;
};

export const isSquareAttacked = (board: BoardState, pos: Position, attackerColor: Color): boolean => {
    // simulates every opponent piece, we check if a specific square is attacked.
    const mockState: GameState = {
        board,
        turn: attackerColor,
        enPassantTarget: null,
        castlingRights: {
            white: { kingside: false, queenside: false },
            black: { kingside: false, queenside: false }
        }
    };

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackerColor) {
                const moves = getPseudoLegalMoves(mockState, { row: r, col: c }, true);
                if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
};