export type GamePhase = "Lobby" | "RoleReveal" | "CluePhase" | "Discussion" | "Voting" | "Reveal";

export type HintMode = "none" | "category" | "vague";
export type RoundMode = "short" | "long";

export interface GameSettings {
	impostorCount: number;
	category: string;
	clueTimeLimit: number; // in seconds
	discussionTimeLimit: number; // in seconds
	hintMode: HintMode;
	roundMode: RoundMode;
}

export interface Player {
	id: string; // Internal session ID
	name: string;
	avatar: string;
	color: string;
	isHost: boolean;
	connected: boolean;
	isSpectator?: boolean;
}

export interface GamePlayer extends Player {
	role: "impostor" | "player";
	word: string | null;
	hint: string | null;
	clue: string | null;
	vote: string | null; // ID of player voted for
}

export interface ClueInfo {
	playerId: string;
	clue: string;
	round?: number;
}

export interface VoteResult {
	playerId: string;
	voterIds: string[];
}

export interface RevealResult {
	eliminatedPlayerIds: string[];
	winners: "impostors" | "players" | "tie"; // tie means no one eliminated or draw
	impostors: string[]; // player IDs
	word: string;
	category: string;
	votes: VoteResult[];
	gameContinues?: boolean;
}

export interface ChatMessage {
	id: string;
	playerId: string;
	text: string;
	timestamp: number;
}

export interface RoomState {
	roundCount?: number;
	code: string;
	phase: GamePhase;
	players: Player[];
	settings: GameSettings;
	timerEndsAt: number | null; // timestamp in ms

	// Clue Phase specific
	currentTurnPlayerId: string | null;
	clues: ClueInfo[];

	// Reveal specific
	revealResult: RevealResult | null;
}

// Sanitized room state for clients (hides secrets)
export interface ClientRoomState extends RoomState {
	myRole?: "impostor" | "player";
	myWord?: string | null;
	myHint?: string | null;
	myVote?: string | null;
	secretCategory?: string;
	hasVoted?: boolean;
}
