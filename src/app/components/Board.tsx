const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function Board() {
    return (
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
    )
}