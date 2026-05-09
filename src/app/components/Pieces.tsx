import {BoardState} from "@/app/types/chess";
import Piece from "@/app/components/Piece";

interface PiecesProps {
    board: BoardState;
}

export default function Pieces({board}: PiecesProps){
    return(
        <div className="absolute inset-0 pointer-events-none">
            {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                    if (!piece) return null;

                    return (
                        <Piece
                            key={`piece-${piece.color}-${piece.type}-${rowIndex}-${colIndex}`}
                            piece={piece}
                            row={rowIndex}
                            col={colIndex}
                        />
                    );
                })
            )}
        </div>
    );
}