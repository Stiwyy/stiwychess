import React from 'react';
import { Position } from '../types/chess';

interface BoardLayerProps {
    selectedSquare: Position | null;
    legalMoves: Position[];
    onSquareClick: (row: number, col: number) => void;
}

export default function Board({ selectedSquare, legalMoves, onSquareClick }: BoardLayerProps) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {ranks.map((rank, rowIndex) =>
                files.map((file, colIndex) => {
                    const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                    const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;

                    const isLegalMove = legalMoves.some(move => move.row === rowIndex && move.col === colIndex);

                    return (
                        <div
                            key={`${file}${rank}`}
                            onClick={() => onSquareClick(rowIndex, colIndex)}
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