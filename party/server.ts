import type { Party, PartyServer, PartyConnection } from "partykit/server";
import { GameState, createInitialGameState, Position, PieceType } from "@/app/types/chess";
import { executeMove } from "@/app/utils/board";
import { getLegalMoves } from "@/app/utils/moves";

type PlayerInfo = { id: string; name: string };

type ClientMessage =
    | { type: "move"; from: Position; to: Position; promotion?: PieceType }
    | { type: "join"; playerColor: "white" | "black"; playerName: string };

export default class ChessServer implements PartyServer {
    gameState: GameState;
    players: { white: PlayerInfo | null; black: PlayerInfo | null };

    constructor(readonly party: Party) {
        this.gameState = createInitialGameState();
        this.players = { white: null, black: null };
    }

    onConnect(conn: PartyConnection) {
        conn.send(JSON.stringify({
            type: "sync",
            gameState: this.gameState,
            players: this.players
        }));
    }

    onMessage(message: string, sender: PartyConnection) {
        const data = JSON.parse(message) as ClientMessage;

        if (data.type === "join") {
            const playerInfo = { id: sender.id, name: data.playerName };
            if (data.playerColor === "white" && !this.players.white) this.players.white = playerInfo;
            else if (data.playerColor === "black" && !this.players.black) this.players.black = playerInfo;

            this.party.broadcast(JSON.stringify({ type: "sync", gameState: this.gameState, players: this.players }));
            return;
        }

        if (data.type === "move") {
            const legalMoves = getLegalMoves(this.gameState, data.from);
            const isLegal = legalMoves.some(m => m.row === data.to.row && m.col === data.to.col);

            const isPlayersTurn =
                (this.gameState.turn === 'white' && sender.id === this.players.white?.id) ||
                (this.gameState.turn === 'black' && sender.id === this.players.black?.id);

            if (isLegal && isPlayersTurn) {
                this.gameState = executeMove(this.gameState, data.from, data.to, data.promotion);

                this.party.broadcast(JSON.stringify({
                    type: "sync",
                    gameState: this.gameState,
                    players: this.players
                }));
            }
        }
    }
}