"use client";

import Image from "next/image";
import Board from "@/app/components/Board";
import { useState, useEffect } from "react";
import { GameState, createInitialGameState, Position, PieceType, BoardState, Color } from "@/app/types/chess";
import Pieces from "@/app/components/Pieces";
import Settings from "@/app/components/Settings";
import { getLegalMoves, getGameStateStatus } from "@/app/utils/moves";
import usePartySocket from "partysocket/react";

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

export default function ChessBoard({ room, playerColor }: { room?: string, playerColor?: "white" | "black" }) {
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());
    const [players, setPlayers] = useState<{ white: string | null, black: string | null }>({ white: null, black: null });

    const [theme, setTheme] = useState<string>('alpha');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
    const [legalMoves, setLegalMoves] = useState<Position[]>([]);

    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [gameStatus, setGameStatus] = useState<'active' | 'checkmate' | 'stalemate' | 'draw_50' | 'draw_repetition' | 'draw_material'>('active');

    const socket = usePartySocket({
        host: "localhost:1999",
        room: room || "local",
        onOpen: () => {
            if (playerColor) {
                socket.send(JSON.stringify({ type: "join", playerColor }));
            }
        },
        onMessage: (evt) => {
            const data = JSON.parse(evt.data);
            if (data.type === "sync") {
                const oldHistoryLen = gameState.moveHistory.length;
                const newHistoryLen = data.gameState.moveHistory.length;

                setGameState(data.gameState);
                setPlayers(data.players);

                if (newHistoryLen > oldHistoryLen) {
                    const lastMove = data.gameState.moveHistory[newHistoryLen - 1];
                    if (lastMove.includes('#')) playSound('Checkmate');
                    else if (lastMove.includes('+')) playSound('Check');
                    else if (lastMove.includes('O-O')) playSound('Castle');
                    else if (lastMove.includes('x')) playSound('Capture');
                    else playSound('Move');
                }
            }
        }
    });

    useEffect(() => {
        setGameStatus(getGameStateStatus(gameState));
    }, [gameState]);

    const handleSquareClick = (row: number, col: number) => {
        if (gameStatus !== 'active' || pendingPromotion) return;
        if (room && (!players.white || !players.black)) return;
        if (room && playerColor && gameState.turn !== playerColor) return;

        const clickedPiece = gameState.board[row][col];
        const isCurrentTurn = clickedPiece && clickedPiece.color === gameState.turn;

        if (!selectedSquare || isCurrentTurn) {
            if (isCurrentTurn && (!room || clickedPiece.color === playerColor)) {
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

            // Promotion Check
            if (piece?.type === 'pawn' && (row === 0 || row === 7)) {
                setPendingPromotion({ from: selectedSquare, to: { row, col } });
                setSelectedSquare(null);
                setLegalMoves([]);
                return;
            }

            if (room) {
                socket.send(JSON.stringify({ type: "move", from: selectedSquare, to: { row, col } }));
            }

            setSelectedSquare(null);
            setLegalMoves([]);
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const handlePromotionChoice = (type: PieceType) => {
        if (!pendingPromotion) return;

        if (room) {
            socket.send(JSON.stringify({
                type: "move",
                from: pendingPromotion.from,
                to: pendingPromotion.to,
                promotion: type
            }));
        }

        setPendingPromotion(null);
    };

    const getPromotionImage = (type: PieceType) => {
        const colorChar = gameState.turn === 'white' ? 'w' : 'b';
        const typeMap: Record<string, string> = { queen: 'Q', rook: 'R', knight: 'N', bishop: 'B' };
        return `/piece/${theme}/${colorChar}${typeMap[type]}.svg`;
    };

    const groupedMoves = [];
    for (let i = 0; i < gameState.moveHistory.length; i += 2) {
        groupedMoves.push({
            white: gameState.moveHistory[i],
            black: gameState.moveHistory[i + 1] || ""
        });
    }

    const isWaitingForOpponent = room && (!players.white || !players.black);

    return (
        <div className="w-full min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 relative bg-gray-950 p-4">

            <div className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-2xl overflow-hidden shrink-0">
                <Board selectedSquare={selectedSquare} legalMoves={legalMoves} onSquareClick={handleSquareClick}/>
                <Pieces board={gameState.board} theme={theme}/>

                {/* PROMOTION MENU */}
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
                                <Image src={getPromotionImage(type)} alt={type} fill className="object-contain drop-shadow-md" />
                            </div>
                        ))}
                    </div>
                )}

                {isWaitingForOpponent && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <h2 className="text-2xl font-bold text-white mb-2">Waiting for Opponent...</h2>
                            <p className="text-gray-400">Room Code: <span className="font-mono text-white bg-gray-800 px-2 py-1 rounded">{room}</span></p>
                        </div>
                    </div>
                )}

                {/* GAME OVER OVERLAY */}
                {gameStatus !== 'active' && !isWaitingForOpponent && (
                    <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-gray-800 border border-gray-600 p-8 rounded-xl shadow-2xl text-center">
                            <h2 className="text-4xl font-bold text-white mb-2">
                                {gameStatus === 'checkmate' ? 'Checkmate!' : 'Draw'}
                            </h2>
                            <p className="text-gray-300 text-lg mb-6">
                                {gameStatus === 'checkmate' && `${gameState.turn === 'white' ? 'Black' : 'White'} wins by Checkmate.`}
                                {gameStatus === 'stalemate' && "Game drawn by Stalemate."}
                                {gameStatus === 'draw_50' && "Game drawn by 50-move rule."}
                                {gameStatus === 'draw_repetition' && "Game drawn by 3-fold repetition."}
                                {gameStatus === 'draw_material' && "Game drawn by insufficient material."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full md:w-64 h-64 md:h-[600px] bg-gray-900 border-2 border-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden">
                <div className="bg-gray-800 p-3 text-white font-semibold text-center border-b border-gray-700">
                    Move History
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {groupedMoves.length === 0 ? (
                        <div className="text-gray-500 text-center mt-4 text-sm">No moves yet</div>
                    ) : (
                        groupedMoves.map((move, index) => (
                            <div key={index} className="flex text-sm py-1 hover:bg-gray-800 rounded px-2">
                                <span className="w-8 text-gray-500 font-mono">{index + 1}.</span>
                                <span className="w-20 text-white font-medium">{move.white}</span>
                                <span className="w-20 text-gray-400">{move.black}</span>
                            </div>
                        ))
                    )}
                </div>
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