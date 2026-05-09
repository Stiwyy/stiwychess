import React from 'react';
import Image from 'next/image';
import { Piece as PieceType } from '../types/chess';

interface PieceProps {
    piece: PieceType;
    row: number;
    col: number;
    theme: string;
}

const getPieceFileName = (color: PieceType['color'], type: PieceType['type']) => {
    const colorChar = color === 'white' ? 'w' : 'b';

    const typeCharMap: Record<PieceType['type'], string> = {
        bishop: 'B',
        king: 'K',
        knight: 'N',
        pawn: 'P',
        queen: 'Q',
        rook: 'R',
    };

    return `${colorChar}${typeCharMap[type]}.svg`;
};

export default function Piece({ piece, row, col, theme }: PieceProps) {
    const fileName = getPieceFileName(piece.color, piece.type);
    const imageSrc = `/piece/${theme}/${fileName}`;

    return (
        <div
            className="absolute flex items-center justify-center pointer-events-auto transition-all duration-300 ease-in-out select-none"
            style={{
                width: '12.5%',
                height: '12.5%',
                transform: `translate(${col * 100}%, ${row * 100}%)`,
                zIndex: 10,
            }}
        >
            <div className="relative w-[80%] h-[80%] cursor-grab active:cursor-grabbing drop-shadow-md">
                <Image
                    src={imageSrc}
                    alt={`${piece.color} ${piece.type}`}
                    fill
                    className="object-contain"
                    draggable={true}
                    priority
                />
            </div>
        </div>
    );
}