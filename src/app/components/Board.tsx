import React from 'react';
import { Position } from '../types/chess';

interface BoardLayerProps {
    selectedSquare: Position | null;
    onSquareClick: (row: number, col: number) => void;
}

export default function BoardLayer({ selectedSquare, onSquareClick }: BoardLayerProps) {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return (
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
            {ranks.map((rank, rowIndex) =>
                files.map((file, colIndex) => {
                    const isLightSquare = (rowIndex + colIndex) % 2 === 0;

                    const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;

                    return (
                        <div
                            key={`${file}${rank}`}
                            onClick={() => onSquareClick(rowIndex, colIndex)}
                            className={`relative cursor-pointer ${isLightSquare ? 'bg-gray-100' : 'bg-gray-800'} w-full h-full flex items-end justify-start p-1`}>
                            {isSelected && (
                                <div className="absolute inset-0 bg-yellow-300/50" />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}