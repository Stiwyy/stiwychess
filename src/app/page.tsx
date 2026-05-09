"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [roomCode, setRoomCode] = useState("");

    const createLobby = () => {
        if (!username.trim()) return alert("Please enter a username!");
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        router.push(`/play/${newCode}?name=${username}&color=white`);
    };

    const joinLobby = () => {
        if (!username.trim()) return alert("Please enter a username!");
        if (!roomCode.trim()) return alert("Please enter a room code!");
        router.push(`/play/${roomCode.toUpperCase()}?name=${username}&color=black`);
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-900 border-2 border-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full flex flex-col gap-6">
                <h1 className="text-3xl font-bold text-white text-center">Multiplayer Chess</h1>

                <div>
                    <label className="text-gray-400 text-sm mb-1 block">Your Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500"
                        placeholder="username"
                    />
                </div>

                <div className="border-t border-gray-800 my-2"></div>

                <button
                    onClick={createLobby}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors"
                >
                    Create New Lobby
                </button>

                <div className="text-center text-gray-500 text-sm">OR</div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 uppercase"
                        placeholder="ROOM CODE"
                        maxLength={4}
                    />
                    <button
                        onClick={joinLobby}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded transition-colors"
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
}