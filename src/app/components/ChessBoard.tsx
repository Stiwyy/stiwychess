"use client";

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function ChessBoard() {

    return (
        <div className="w-full max-w-2xl aspect-square relative border-2 border-gray-800 rounded shadow-lg overflow-hidden">

            {/* Board Layer*/}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                {ranks.map((rank, rowIndex) => files.map((file, colIndex) => {
                    const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                    return (
                        <div key={`${file}${rank}`}
                             className={`${isLightSquare ? 'bg-gray-100' : 'bg-gray-800'} w-full h-full flex items-end justify-start p-1`}>
                        </div>
                    );
                }))}
            </div>


        </div>

    )
}