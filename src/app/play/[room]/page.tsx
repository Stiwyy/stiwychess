"use client";

import ChessBoard from "@/app/components/ChessBoard";
import { useSearchParams } from "next/navigation";
import { use } from "react";

export default function PlayRoom({ params }: { params: Promise<{ room: string }> }) {
    const resolvedParams = use(params);
    const room = resolvedParams.room;

    const searchParams = useSearchParams();
    const playerName = searchParams.get("name") || "Guest";
    const playerColor = (searchParams.get("color") as "white" | "black") || "white";

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center">
            <div className="w-full bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center z-10">
                <div className="text-white font-bold">Room: <span className="text-blue-400">{room}</span></div>
                <div className="text-gray-400">Playing as: <span className="text-white">{playerName} ({playerColor})</span></div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center">
                <ChessBoard room={room} playerColor={playerColor} playerName={playerName} />
            </div>
        </div>
    );
}