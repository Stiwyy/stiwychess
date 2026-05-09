import React from 'react';
import { Position } from '../types/chess';

interface BoardLayerProps {
    selectedSquare: Position | null;
    legalMoves: Position[];
    onSquareClick: (row: number, col: number) => void;
    isFlipped: boolean;
}

export default function Board({ selectedSquare, legalMoves, onSquareClick, isFlipped }: BoardLayerProps) {
    const rows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {rows.map((row) =>
                cols.map((col) => {
                    const isLightSquare = (row + col) % 2 === 0;
                    const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
                    const isLegalMove = legalMoves.some(move => move.row === row && move.col === col);

                    return (
                        <div
                            key={`${row}-${col}`}
                            onClick={() => onSquareClick(row, col)}
                            className={`relative cursor-pointer ${isLightSquare ? 'bg-[#ebecd0]' : 'bg-gray-800'} w-full h-full flex items-center justify-center`}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 bg-yellow-400/40" />
                            )}

                            {isLegalMove && (
                                <div className="w-[30%] h-[30%] rounded-full bg-black/20 z-20 pointer-events-none" />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}