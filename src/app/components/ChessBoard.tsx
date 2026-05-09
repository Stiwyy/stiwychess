"use client";


import Board from "@/app/components/Board";
import {useState} from "react";
import {BoardState, createInitialBoard} from "@/app/types/chess";

export default function ChessBoard() {
    const [board, setBoard] = useState<BoardState>(createInitialBoard());

    return (
        <div className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden">
            <Board/>
        </div>

    )
}