import { useState } from "react";
import {BoardState} from "@/app/types/chess";


const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function Pieces(){
    const [board, setBoard] = useState<BoardState>(() => {
        const initialBoard: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
        return initialBoard;
    });

    return(

    )
}