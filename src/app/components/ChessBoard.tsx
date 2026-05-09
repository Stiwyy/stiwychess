"use client";


import Board from "@/app/components/Board";

export default function ChessBoard() {

    return (
        <div className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden">
            <Board/>
        </div>

    )
}