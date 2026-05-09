import React from 'react';

const THEMES = [
    'alpha', 'anarcandy', 'caliente', 'california', 'cardinal', 'cburnett',
    'celtic', 'chess7', 'chessnut', 'companion', 'cooke', 'disguised',
    'dubrovny', 'fantasy', 'firi', 'fresca', 'gioco', 'governor', 'horsey',
    'icpieces', 'kiwen-suwi', 'kosal', 'leipzig', 'letter', 'maestro',
    'merida', 'monarchy', 'mono', 'mpchess', 'pirouetti', 'pixel',
    'reillycraig', 'rhosgfx', 'riohacha', 'shahi-ivory-brown', 'shapes',
    'spatial', 'staunty', 'tatiana', 'xkcd'
];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
}

export default function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl shadow-2xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                <div className="flex flex-col gap-2">
                    <label htmlFor="theme-select" className="text-sm text-gray-300 font-medium">
                        Pieces Design
                    </label>
                    <select
                        id="theme-select"
                        value={currentTheme}
                        onChange={(e) => onThemeChange(e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                    >
                        {THEMES.map((t) => (
                            <option key={t} value={t}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}