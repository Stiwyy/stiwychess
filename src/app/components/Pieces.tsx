import {BoardState} from "@/app/types/chess";
import Piece from "@/app/components/Piece";

interface PiecesProps {
    board: BoardState;
    theme: string;
}

export default function Pieces({board, theme}: PiecesProps){
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
                            theme={theme}
                        />
                    );
                })
            )}
        </div>
    );
}