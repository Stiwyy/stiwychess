"use client";

import Board from "@/app/components/Board";
import {useEffect, useState} from "react";
import {GameState, createInitialGameState, Position, PieceType} from "@/app/types/chess";
import Pieces from "@/app/components/Pieces";
import Settings from "@/app/components/Settings";
import { executeMove } from "@/app/utils/board";
import {getGameStateStatus, getLegalMoves, findKing, isSquareAttacked} from "@/app/utils/moves";
import Image from "next/image";


interface PendingPromotion {
    from: Position;
    to: Position;
}

const playSound = (type: 'Move' | 'Capture' | 'Check' | 'Checkmate' | 'Castle') => {
    if (typeof window !== 'undefined') {
        const audio = new Audio(`/sound/${type}.mp3`);
        audio.play().catch(e => console.log("Audio play failed:", e));
    }
};

export default function ChessBoard() {
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());

    const [theme, setTheme] = useState<string>('alpha');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
    const [legalMoves, setLegalMoves] = useState<Position[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [gameStatus, setGameStatus] = useState<'active' | 'checkmate' | 'stalemate'>('active');

    useEffect(() => {
        setGameStatus(getGameStateStatus(gameState));
    }, [gameState]);

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
            const piece = gameState.board[selectedSquare.row][selectedSquare.col];

            const targetSquarePiece = gameState.board[row][col];
            const isEnPassant = piece?.type === 'pawn' &&
                gameState.enPassantTarget?.row === row &&
                gameState.enPassantTarget?.col === col;
            const isCapture = targetSquarePiece !== null || isEnPassant;
            const isCastle = piece?.type === 'king' && Math.abs(col - selectedSquare.col) === 2;

            // Promotion Check
            if (piece?.type === 'pawn' && (row === 0 || row === 7)) {
                setPendingPromotion({ from: selectedSquare, to: { row, col } });
                setSelectedSquare(null);
                setLegalMoves([]);
                return;
            }

            // normal move
            const newGameState = executeMove(gameState, selectedSquare, { row, col });
            finishMove(newGameState, isCapture, isCastle);
            setSelectedSquare(null);
            setLegalMoves([]);
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const handlePromotionChoice = (type: PieceType) => {
        if (!pendingPromotion) return;

        const targetSquarePiece = gameState.board[pendingPromotion.to.row][pendingPromotion.to.col];
        const isCapture = targetSquarePiece !== null;

        const newGameState = executeMove(gameState, pendingPromotion.from, pendingPromotion.to, type);

        finishMove(newGameState, isCapture);

        setPendingPromotion(null);
    };

    const getPromotionImage = (type: PieceType) => {
        const colorChar = gameState.turn === 'white' ? 'w' : 'b';
        const typeMap: Record<string, string> = { queen: 'Q', rook: 'R', knight: 'N', bishop: 'B' };
        return `/piece/${theme}/${colorChar}${typeMap[type]}.svg`;
    };

    const finishMove = (newGameState: GameState, isCapture: boolean, isCastle: boolean = false) => {
        setGameState(newGameState);

        const status = getGameStateStatus(newGameState);
        if (status === 'checkmate') {
            playSound('Checkmate');
        } else {
            const nextTurnColor = newGameState.turn;
            const kingPos = findKing(newGameState.board, nextTurnColor);
            const inCheck = kingPos && isSquareAttacked(newGameState.board, kingPos, nextTurnColor === 'white' ? 'black' : 'white');

            if (inCheck) {
                playSound('Check');
            } else if (isCapture) {
                playSound('Capture');
            } else if (isCastle) {
                playSound('Castle')
            } else {
                playSound('Move');
            }
        }
    };

    return (
            <div className="w-full min-h-screen flex items-center justify-center relative">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="fixed top-6 right-6 p-2 rounded-full hover:bg-gray-800 transition-colors z-40 text-gray-400 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path
                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>

                <div
                    className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden">
                    <Board selectedSquare={selectedSquare} legalMoves={legalMoves} onSquareClick={handleSquareClick}/>
                    <Pieces board={gameState.board} theme={theme}/>
                    {pendingPromotion && (
                        <div
                            className="absolute z-50 w-[12.5%] bg-white/90 backdrop-blur-sm rounded-md shadow-2xl flex flex-col overflow-hidden border border-gray-300"
                            style={{
                                left: `${(pendingPromotion.to.col / 8) * 100}%`,
                                top: pendingPromotion.to.row === 0 ? '0' : 'auto',
                                bottom: pendingPromotion.to.row === 7 ? '0' : 'auto',
                            }}
                        >
                            {(['queen', 'knight', 'rook', 'bishop'] as PieceType[]).map(type => (
                                <div
                                    key={type}
                                    onClick={() => handlePromotionChoice(type)}
                                    className="w-full aspect-square relative cursor-pointer hover:bg-black/10 transition-colors p-1"
                                >
                                    <Image src={getPromotionImage(type)} alt={type} fill
                                           className="object-contain drop-shadow-md"/>
                                </div>
                            ))}
                        </div>
                    )}

                    {gameStatus !== 'active' && (
                        <div
                            className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <div
                                className="bg-gray-800 border border-gray-600 p-8 rounded-xl shadow-2xl text-center animate-in fade-in zoom-in duration-300">
                                <h2 className="text-4xl font-bold text-white mb-2">
                                    {gameStatus === 'checkmate' ? 'Checkmate!' : 'Stalemate'}
                                </h2>
                                <p className="text-gray-300 text-lg mb-6">
                                    {gameStatus === 'checkmate'
                                        ? `${gameState.turn === 'white' ? 'Black' : 'White'} wins the game.`
                                        : "The game is a draw."}
                                </p>
                                <button
                                    onClick={() => setGameState(createInitialGameState())}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    Play Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentTheme={theme}
                onThemeChange={setTheme}/>
        </div>
    );
}