"use client";

import Image from "next/image";
import Board from "@/app/components/Board";
import { useState, useEffect } from "react";
import { GameState, createInitialGameState, Position, PieceType, BoardState } from "@/app/types/chess";
import Pieces from "@/app/components/Pieces";
import Settings from "@/app/components/Settings";
import { getLegalMoves, getGameStateStatus } from "@/app/utils/moves";
import usePartySocket from "partysocket/react";

interface PendingPromotion {
    from: Position;
    to: Position;
}

type PlayerInfo = { id: string; name: string };

const playSound = (type: 'Move' | 'Capture' | 'Check' | 'Checkmate' | 'Castle') => {
    if (typeof window !== 'undefined') {
        const audio = new Audio(`/sound/${type}.mp3`);
        audio.play().catch(e => console.log("Audio play failed:", e));
    }
};

const INITIAL_COUNTS = { pawn: 8, knight: 2, bishop: 2, rook: 2, queen: 1 };
const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
const SORT_ORDER = { pawn: 1, knight: 2, bishop: 3, rook: 4, queen: 5 };
const TYPE_MAP: Record<string, string> = { queen: 'Q', rook: 'R', knight: 'N', bishop: 'B', pawn: 'P' };

const getCapturedPiecesAndScore = (board: BoardState) => {
    const counts = {
        white: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 },
        black: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0 }
    };

    board.forEach(row => row.forEach(p => {
        if (p) counts[p.color][p.type]++;
    }));

    const captured = { white: [] as PieceType[], black: [] as PieceType[] };
    let whiteScore = 0;
    let blackScore = 0;

    (['pawn', 'knight', 'bishop', 'rook', 'queen'] as PieceType[]).forEach(type => {
        const wCap = INITIAL_COUNTS[type] - counts.white[type];
        const bCap = INITIAL_COUNTS[type] - counts.black[type];

        for (let i = 0; i < wCap; i++) captured.white.push(type);
        for (let i = 0; i < bCap; i++) captured.black.push(type);

        whiteScore += counts.white[type] * PIECE_VALUES[type];
        blackScore += counts.black[type] * PIECE_VALUES[type];
    });

    return {
        capturedByWhite: captured.black.sort((a, b) => SORT_ORDER[a] - SORT_ORDER[b]),
        capturedByBlack: captured.white.sort((a, b) => SORT_ORDER[a] - SORT_ORDER[b]),
        advantageWhite: Math.max(0, whiteScore - blackScore),
        advantageBlack: Math.max(0, blackScore - whiteScore)
    };
};

export default function ChessBoard({ room, playerColor, playerName }: { room?: string, playerColor?: "white" | "black", playerName?: string }) {
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());
    const [players, setPlayers] = useState<{ white: PlayerInfo | null, black: PlayerInfo | null }>({ white: null, black: null });

    const [theme, setTheme] = useState<string>('alpha');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
    const [legalMoves, setLegalMoves] = useState<Position[]>([]);

    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [gameStatus, setGameStatus] = useState<'active' | 'checkmate' | 'stalemate' | 'draw_50' | 'draw_repetition' | 'draw_material'>('active');

    const isFlipped = playerColor === 'black';

    const socket = usePartySocket({
        host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
        room: room || "local",
        onOpen: () => {
            if (playerColor && playerName) {
                socket.send(JSON.stringify({ type: "join", playerColor, playerName }));
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
        if (room) socket.send(JSON.stringify({ type: "move", from: pendingPromotion.from, to: pendingPromotion.to, promotion: type }));
        setPendingPromotion(null);
    };

    const getPromotionImage = (type: PieceType) => {
        const colorChar = gameState.turn === 'white' ? 'w' : 'b';
        return `/piece/${theme}/${colorChar}${TYPE_MAP[type]}.svg`;
    };

    const groupedMoves = [];
    for (let i = 0; i < gameState.moveHistory.length; i += 2) {
        groupedMoves.push({ white: gameState.moveHistory[i], black: gameState.moveHistory[i + 1] || "" });
    }

    const isWaitingForOpponent = room && (!players.white || !players.black);

    // Get material & capture data
    const { capturedByWhite, capturedByBlack, advantageWhite, advantageBlack } = getCapturedPiecesAndScore(gameState.board);

    // Determine top and bottom UI assignments based on flip state
    const topPlayerInfo = isFlipped ? players.white : players.black;
    const bottomPlayerInfo = isFlipped ? players.black : players.white;
    const topCaptured = isFlipped ? capturedByWhite : capturedByBlack;
    const bottomCaptured = isFlipped ? capturedByBlack : capturedByWhite;
    const topAdvantage = isFlipped ? advantageWhite : advantageBlack;
    const bottomAdvantage = isFlipped ? advantageBlack : advantageWhite;
    const topCapturedColorPrefix = isFlipped ? 'b' : 'w';
    const bottomCapturedColorPrefix = isFlipped ? 'w' : 'b';

    // UI Component for Player Tag
    const PlayerTag = ({ name, captured, advantage, piecePrefix }: { name: string, captured: PieceType[], advantage: number, piecePrefix: string }) => (
        <div className="flex items-center gap-3 w-full py-2">
            <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded shadow-sm flex items-center justify-center font-bold text-gray-300 text-lg">
                {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex flex-col flex-1">
                <span className="font-semibold text-white text-sm">{name || 'Waiting...'}</span>
                <div className="flex items-center h-4 mt-1">
                    {captured.map((type, i) => (
                        <div key={i} className={`relative w-4 h-4 ${i !== 0 ? '-ml-1.5' : ''}`}>
                            <Image src={`/piece/${theme}/${piecePrefix}${TYPE_MAP[type]}.svg`} alt={type} fill className="object-contain drop-shadow" />
                        </div>
                    ))}
                    {advantage > 0 && <span className="text-xs text-gray-400 font-semibold ml-2">+{advantage}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 relative bg-gray-950 p-4">

            <button
                onClick={() => setIsSettingsOpen(true)}
                className="fixed top-6 right-6 p-2 rounded-full hover:bg-gray-800 transition-colors z-40 text-gray-400 hover:text-white"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>

            <div className="flex flex-col w-full max-w-2xl flex-shrink-0 relative">

                <PlayerTag
                    name={topPlayerInfo?.name || "Waiting..."}
                    captured={topCaptured}
                    advantage={topAdvantage}
                    piecePrefix={topCapturedColorPrefix}
                />

                {/* Board Container */}
                <div className="w-full aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden bg-gray-900 mt-1 mb-1">
                    <Board selectedSquare={selectedSquare} legalMoves={legalMoves} onSquareClick={handleSquareClick} isFlipped={isFlipped} />
                    <Pieces board={gameState.board} theme={theme} isFlipped={isFlipped} />

                    {pendingPromotion && (
                        <div
                            className="absolute z-50 w-[12.5%] bg-white/90 backdrop-blur-sm rounded-md shadow-2xl flex flex-col overflow-hidden border border-gray-300"
                            style={{
                                left: `${((isFlipped ? 7 - pendingPromotion.to.col : pendingPromotion.to.col) / 8) * 100}%`,
                                top: (isFlipped ? 7 - pendingPromotion.to.row : pendingPromotion.to.row) === 0 ? '0' : 'auto',
                                bottom: (isFlipped ? 7 - pendingPromotion.to.row : pendingPromotion.to.row) === 7 ? '0' : 'auto',
                            }}
                        >
                            {(['queen', 'knight', 'rook', 'bishop'] as PieceType[]).map(type => (
                                <div key={type} onClick={(e) => { e.stopPropagation(); handlePromotionChoice(type); }} className="w-full aspect-square relative cursor-pointer hover:bg-black/10 transition-colors p-1">
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

                    {gameStatus !== 'active' && !isWaitingForOpponent && (
                        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-gray-800 border border-gray-600 p-8 rounded-xl shadow-2xl text-center">
                                <h2 className="text-4xl font-bold text-white mb-2">{gameStatus === 'checkmate' ? 'Checkmate!' : 'Draw'}</h2>
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

                <PlayerTag
                    name={bottomPlayerInfo?.name || playerName || "Waiting..."}
                    captured={bottomCaptured}
                    advantage={bottomAdvantage}
                    piecePrefix={bottomCapturedColorPrefix}
                />

            </div>

            {/* Move History Panel */}
            <div className="w-full md:w-64 h-64 md:h-[600px] flex flex-col overflow-hidden bg-gray-900 border-2 border-gray-800 rounded-lg shadow-xl">
                <div className="bg-gray-800 p-3 text-white font-semibold text-center border-b border-gray-700">Move History</div>
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

            <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentTheme={theme} onThemeChange={setTheme} />
        </div>
    );
}