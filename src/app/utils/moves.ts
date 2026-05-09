import {BoardState, Color, Position} from "@/app/types/chess";

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

export const getPseudoLegalMoves = (board: BoardState, from: Position): Position[] => {
    const piece = board[from.row][from.col];
    if (!piece) return [];

    const moves: Position[] = [];
    const { row, col } = from;
    const color = piece.color;

    const straightDirs = [[-1, 0], [1, 0], [0,-1], [0, 1]];
    const diagonalDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    switch (piece.type) {
        case 'pawn':
            // allow to move only 1 square forward
            const direction = color === 'white' ? -1 : 1;
            // starting position for the pawn
            const startRow = color === 'white' ? 6 : 1;


            // 1 square forward
            if (isWithinBoard(row + direction, col) && !board[row + direction][col]) {
                moves.push({row: row + direction, col: col});

                // allow to move 2 forward if its from the starting position
                if (row === startRow && !board[row + direction * 2][col]) {
                    moves.push({row: row + direction * 2, col});
                }
            }

            // if piece of opponent is diagonal to the pawn it can take it
            for (const dCol of [-1, 1]) {
                if (isWithinBoard(row + direction, col + dCol)) {
                    const target = board[row + direction][col + dCol];
                    if (target && target.color !== color) {
                        moves.push({row: row + direction, col: col + dCol});
                    }
                }
            }
            break;

        case 'knight':
            const knightDirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

            // move in L shape if sqaure is empty or piece of opponent
            for (const [dRow, dCol] of knightDirs) {
                const nRow = row + dRow, nCol = col + dCol;
                if (isWithinBoard(nRow, nCol)) {
                    const target = board[nRow][nCol];
                    if (!target || target.color !== color) moves.push({ row: nRow, col: nCol });
                }
            }
            break;

        case 'bishop':
            moves.push(...getSlidingMoves(board, from, color, diagonalDirs));
            break;

        case 'rook':
            moves.push(...getSlidingMoves(board, from, color, straightDirs));
            break;

        case 'queen':
            moves.push(...getSlidingMoves(board, from, color, [...straightDirs, ...diagonalDirs]));
            break;

        case 'king':
            const kingDirs = [...straightDirs, ...diagonalDirs];
            for (const [dRow, dCol] of kingDirs) {
                const kRow = row + dRow, kCol = col + dCol;
                if (isWithinBoard(kRow, kCol)) {
                    const target = board[kRow][kCol];
                    if (!target || target.color !== color) moves.push({ row: kRow, col: kCol });
                }
            }
            break;
    }
    return moves;
}

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
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === attackerColor) {
                const moves = getPseudoLegalMoves(board, { row: r, col: c });
                if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
};