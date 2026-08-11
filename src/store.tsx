import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ChatMessage, ClientRoomState, GameSettings } from "./types";

interface GameContextType {
	socket: Socket | null;
	roomState: ClientRoomState | null;
	sessionId: string | null;
	roomCode: string | null;
	chatMessages: ChatMessage[];
	isCreator: boolean;
	createRoom: () => void;
	joinRoom: (code: string) => void;
	leaveRoom: () => void;
	updatePlayer: (name: string, avatar: string, color: string) => void;
	updateSettings: (settings: Partial<GameSettings>) => void;
	startGame: () => void;
	submitClue: (clue: string) => void;
	submitVote: (votedForId: string | null) => void;
	nextRound: () => void;
	sendChatMessage: (text: string) => void;
	toggleSkipDiscussion: () => void;
	kickPlayer: (targetId: string) => void;
	error: string | null;
	clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
	const ctx = useContext(GameContext);
	if (!ctx) throw new Error("useGame must be used within GameProvider");
	return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem("impostor_sessionId"));
	const [roomCode, setRoomCode] = useState<string | null>(localStorage.getItem("impostor_roomCode"));
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isCreator, setIsCreator] = useState<boolean>(localStorage.getItem("impostor_isCreator") === "true");

	const sessionIdRef = useRef(sessionId);
	sessionIdRef.current = sessionId;
	const roomCodeRef = useRef(roomCode);
	roomCodeRef.current = roomCode;

	useEffect(() => {
		const serverUrl = import.meta.env.VITE_SERVER_URL;
		const newSocket = serverUrl ? io(serverUrl) : io();
		setSocket(newSocket);

		newSocket.on("connect", () => {
			// Try to rejoin
			if (roomCodeRef.current && sessionIdRef.current) {
				newSocket.emit(
					"rejoin_room",
					{ roomCode: roomCodeRef.current, sessionId: sessionIdRef.current },
					(res: any) => {
						if (res.success) {
							console.log("Rejoined successfully");
						} else {
							// Failed to rejoin
							setSessionId(null);
							setRoomCode(null);
							localStorage.removeItem("impostor_sessionId");
							localStorage.removeItem("impostor_roomCode");
						}
					},
				);
			}
		});

		newSocket.on("room_state_update", (state: ClientRoomState) => {
			setRoomState(state);
		});

		newSocket.on("chat_message", (msg: ChatMessage) => {
			setChatMessages((prev) => [...prev, msg]);
		});

		newSocket.on("clear_chat", () => {
			setChatMessages([]);
		});

		newSocket.on("kicked", () => {
			setError("You have been kicked by the host.");
			setRoomCode(null);
			setRoomState(null);
			setIsCreator(false);
			localStorage.removeItem("impostor_roomCode");
			localStorage.removeItem("impostor_sessionId");
			localStorage.removeItem("impostor_isCreator");
		});

		return () => {
			newSocket.disconnect();
		};
	}, []); // Run once on mount

	const createRoom = () => {
		if (!socket) return;
		setError(null);
		socket.emit("create_room", {}, (res: any) => {
			if (res.success) {
				setRoomCode(res.roomCode);
				setSessionId(res.sessionId);
				setIsCreator(true);
				localStorage.setItem("impostor_roomCode", res.roomCode);
				localStorage.setItem("impostor_sessionId", res.sessionId);
				localStorage.setItem("impostor_isCreator", "true");
			} else {
				setError("Failed to create room");
			}
		});
	};

	const joinRoom = (code: string) => {
		if (!socket) return;
		setError(null);
		socket.emit("join_room", { roomCode: code }, (res: any) => {
			if (res.success) {
				setRoomCode(code.toUpperCase());
				setSessionId(res.sessionId);
				setIsCreator(false);
				localStorage.setItem("impostor_roomCode", code.toUpperCase());
				localStorage.setItem("impostor_sessionId", res.sessionId);
				localStorage.setItem("impostor_isCreator", "false");
			} else {
				setError(res.error || "Failed to join room");
			}
		});
	};

	const leaveRoom = () => {
		setRoomCode(null);
		setRoomState(null);
		setError(null);
		setIsCreator(false);
		localStorage.removeItem("impostor_roomCode");
		localStorage.removeItem("impostor_sessionId");
		localStorage.removeItem("impostor_isCreator");
		if (socket) {
			socket.emit("leave_room");
		}
	};

	const updatePlayer = (name: string, avatar: string, color: string) => {
		if (!socket || !roomCode) return;
		socket.emit("update_player", { roomCode, name, avatar, color });
	};

	const updateSettings = (settings: Partial<GameSettings>) => {
		if (!socket || !roomCode || !roomState) return;
		setRoomState({ ...roomState, settings: { ...roomState.settings, ...settings } });
		socket.emit("update_settings", { roomCode, settings });
	};

	const startGame = () => {
		if (!socket || !roomCode) return;
		socket.emit("start_game", { roomCode });
	};

	const submitClue = (clue: string) => {
		if (!socket || !roomCode) return;
		socket.emit("submit_clue", { roomCode, clue });
	};

	const submitVote = (votedForId: string | null) => {
		if (!socket || !roomCode) return;
		socket.emit("submit_vote", { roomCode, votedForId });
	};

	const nextRound = () => {
		if (!socket || !roomCode) return;
		socket.emit("next_round", { roomCode });
	};

	const sendChatMessage = (text: string) => {
		if (!socket || !roomCode) return;
		socket.emit("chat_message", { roomCode, text });
	};

	const toggleSkipDiscussion = () => {
		if (!socket || !roomCode) return;
		socket.emit("toggle_skip_discussion", { roomCode });
	};

	const kickPlayer = (targetId: string) => {
		if (!socket || !roomCode) return;
		socket.emit("kick_player", { roomCode, targetId });
	};

	return (
		<GameContext.Provider
			value={{
				socket,
				roomState,
				sessionId,
				roomCode,
				chatMessages,
				isCreator,
				createRoom,
				joinRoom,
				leaveRoom,
				updatePlayer,
				updateSettings,
				startGame,
				submitClue,
				submitVote,
				nextRound,
				sendChatMessage,
				kickPlayer,
				toggleSkipDiscussion,
				error,
				clearError: () => setError(null),
			}}
		>
			{children}
		</GameContext.Provider>
	);
};
