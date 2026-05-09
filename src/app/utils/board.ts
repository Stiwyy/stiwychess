import {BoardState, Position} from "@/app/types/chess";

export const movePiece = ( board: BoardState, from: Position, to: Position ): BoardState => {
    const newBoard = board.map(row => [...row]);

    newBoard[to.row][to.col] = newBoard[from.row][from.col];

    newBoard[from.row][from.col] = null;

    return newBoard;
}