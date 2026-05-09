"use client";

import Board from "@/app/components/Board";
import { useState } from "react";
import { GameState, createInitialGameState, Position } from "@/app/types/chess";
import Pieces from "@/app/components/Pieces";
import Settings from "@/app/components/Settings";
import { executeMove } from "@/app/utils/board";
import { getLegalMoves } from "@/app/utils/moves";

export default function ChessBoard() {
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());

    const [theme, setTheme] = useState<string>('alpha');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
    const [legalMoves, setLegalMoves] = useState<Position[]>([]);

    const handleSquareClick = (row: number, col: number) => {
        const clickedPiece = gameState.board[row][col];
        const isCurrentTurn = clickedPiece && clickedPiece.color === gameState.turn;

        if (!selectedSquare || isCurrentTurn) {
            if (isCurrentTurn) {
                const pos = { row, col };
                setSelectedSquare(pos);
                setLegalMoves(getLegalMoves(gameState, pos));
            } else if (!selectedSquare) {
                setSelectedSquare(null);
                setLegalMoves([]);
            }
            return;
        }

        const isLegalMove = legalMoves.some(m => m.row === row && m.col === col);

        if (isLegalMove) {
            const newGameState = executeMove(gameState, selectedSquare, { row, col });
            setGameState(newGameState);
            setSelectedSquare(null);
            setLegalMoves([]);

        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center relative">
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="fixed top-6 right-6 p-2 rounded-full hover:bg-gray-800 transition-colors z-40 text-gray-400 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>

            <div className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden">
                <Board selectedSquare={selectedSquare} legalMoves={legalMoves} onSquareClick={handleSquareClick}/>
                <Pieces board={gameState.board} theme={theme}/>
            </div>

            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentTheme={theme}
                onThemeChange={setTheme}
            />
        </div>
    );
}