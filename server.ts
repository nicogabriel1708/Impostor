import express from "express";
import { createServer } from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import { Room } from "./server/roomManager";

const PORT = 3000;

async function startServer() {
	const app = express();
	const httpServer = createServer(app);
	const io = new Server(httpServer, {
		cors: { origin: "*" },
	});

	const rooms: Map<string, Room> = new Map();

	// Helper to generate room code
	const generateRoomCode = () => {
		const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		let code = "";
		for (let i = 0; i < 4; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return code;
	};

	const broadcastRoomState = (room: Room) => {
		for (const [playerId, player] of room.players.entries()) {
			io.to(playerId).emit("room_state_update", room.getClientState(playerId));
		}
	};

	// Housekeeping interval
	setInterval(
		() => {
			const now = Date.now();
			for (const [code, room] of rooms.entries()) {
				if (now - room.lastActivityAt > 60 * 60 * 1000) {
					rooms.delete(code);
				} else if (room.players.size === 0 && now - room.lastActivityAt > 2 * 60 * 1000) {
					rooms.delete(code);
				}
			}
		},
		5 * 60 * 1000,
	);

	io.on("connection", (socket: Socket) => {
		socket.on("create_room", (...args) => {
			const callback = args.find((arg) => typeof arg === "function");
			if (!callback) return;
			let code = generateRoomCode();
			while (rooms.has(code)) code = generateRoomCode();

			const room = new Room(code, io);
			rooms.set(code, room);

			const sessionId = Math.random().toString(36).substring(2, 15);
			socket.data.sessionId = sessionId;

			// The socket joins a room named by their own socket ID for private messages
			socket.join(sessionId);
			// Also join the global socket.io room for the game room to receive chat, etc.
			socket.join(code);

			callback({ success: true, roomCode: code, sessionId });
		});

		socket.on("join_room", (...args) => {
			const callback = args.find((arg) => typeof arg === "function");
			const data = args.find((arg) => typeof arg === "object" && arg !== null);
			if (!callback || !data) return;
			const { roomCode } = data;
			const room = rooms.get(roomCode.toUpperCase());
			if (!room) {
				return callback({ success: false, error: "Room not found" });
			}
			if (room.players.size >= 12) {
				return callback({ success: false, error: "Room is full" });
			}

			const sessionId = Math.random().toString(36).substring(2, 15);
			socket.data.sessionId = sessionId;

			socket.join(sessionId);
			socket.join(roomCode.toUpperCase());

			callback({ success: true, roomCode: roomCode.toUpperCase(), sessionId });
		});

		socket.on("rejoin_room", (...args) => {
			const callback = args.find((arg) => typeof arg === "function");
			const data = args.find((arg) => typeof arg === "object" && arg !== null);
			if (!callback || !data) return;
			const { roomCode, sessionId } = data;
			const room = rooms.get(roomCode.toUpperCase());
			if (!room) return callback({ success: false });

			const player = room.players.get(sessionId);
			if (!player) return callback({ success: false });

			socket.data.sessionId = sessionId;
			socket.join(sessionId);
			socket.join(roomCode.toUpperCase());

			player.connected = true;
			room.checkHostTransfer();
			broadcastRoomState(room);
			callback({ success: true });
		});

		socket.on("update_player", ({ roomCode, name, avatar, color }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (!room) return;
			const sessionId = socket.data.sessionId;

			if (!room.players.has(sessionId)) {
				// Prevent duplicate names
				let finalName = name.trim().substring(0, 16);
				let suffix = 1;
				while (Array.from(room.players.values()).some((p) => p.name === finalName)) {
					finalName = `${name.trim().substring(0, 14)}${suffix}`;
					suffix++;
				}
				room.addPlayer(sessionId, finalName, avatar, color || "bg-indigo-500");
			} else {
				const p = room.players.get(sessionId)!;
				p.name = name.trim().substring(0, 16);
				p.avatar = avatar;
				if (color) p.color = color;
			}

			broadcastRoomState(room);
		});

		socket.on("update_settings", ({ roomCode, settings }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (!room || room.phase !== "Lobby") return;
			const sessionId = socket.data.sessionId;
			const player = room.players.get(sessionId);
			if (player && player.isHost) {
				room.settings = { ...room.settings, ...settings };
				broadcastRoomState(room);
			}
		});

		socket.on("start_game", ({ roomCode }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (!room) return;
			const sessionId = socket.data.sessionId;
			const player = room.players.get(sessionId);
			if (player && player.isHost) {
				room.startGame();

				// Notify role reveals, and schedule automatic transitions
				broadcastRoomState(room);

				// After 8 seconds, Room automatically transitions to CluePhase
				setTimeout(() => broadcastRoomState(room), 8500);
			}
		});

		socket.on("submit_clue", ({ roomCode, clue }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (room) {
				const sessionId = socket.data.sessionId;
				room.submitClue(sessionId, clue);
				broadcastRoomState(room);

				// If it transitioned to Discussion, broadcast again
				if (room.phase === "Discussion") {
					setTimeout(() => broadcastRoomState(room), 100);
				}
			}
		});

		socket.on("submit_vote", ({ roomCode, votedForId }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (room) {
				const sessionId = socket.data.sessionId;
				room.submitVote(sessionId, votedForId);
				broadcastRoomState(room);
			}
		});

		socket.on("next_round", ({ roomCode }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (!room) return;
			const sessionId = socket.data.sessionId;
			const player = room.players.get(sessionId);
			if (player && player.isHost && room.phase === "Reveal") {
				room.nextRound();
				broadcastRoomState(room);
			}
		});

		socket.on("chat_message", ({ roomCode, text }) => {
			const room = rooms.get(roomCode.toUpperCase());
			if (room) {
				const sessionId = socket.data.sessionId;
				const p = room.players.get(sessionId);
				if (p && !p.isSpectator) {
					io.to(roomCode.toUpperCase()).emit("chat_message", {
						id: Math.random().toString(36).substring(7),
						playerId: p.id,
						text: text.substring(0, 100),
						timestamp: Date.now(),
					});
				}
			}
		});

		socket.on("disconnect", async () => {
			const sessionId = socket.data.sessionId;
			if (!sessionId) return;

			const sockets = await io.in(sessionId).fetchSockets();
			if (sockets.length > 0) return; // Player is still connected via another socket

			// Find all rooms this socket was in
			for (const room of rooms.values()) {
				if (room.players.has(sessionId)) {
					const p = room.players.get(sessionId)!;
					p.connected = false;

					if (room.phase === "Lobby") {
						room.removePlayer(sessionId);
					} else {
						// Keep them in the game so they can rejoin, but mark offline
						room.checkHostTransfer();

						// Allow 2 minutes grace period, then remove if still disconnected
						setTimeout(
							() => {
								const pCheck = room.players.get(sessionId);
								if (pCheck && !pCheck.connected) {
									room.removePlayer(sessionId);
									broadcastRoomState(room);
								}
							},
							2 * 60 * 1000,
						);
					}
					broadcastRoomState(room);
				}
			}
		});

		socket.on("kick_player", ({ roomCode, targetId }) => {
			const sessionId = socket.data.sessionId;
			if (!sessionId || !roomCode) return;

			const room = rooms.get(roomCode.toUpperCase());
			if (!room) return;

			const me = room.players.get(sessionId);
			if (!me || !me.isHost) return;

			if (room.players.has(targetId)) {
				room.removePlayer(targetId);
				broadcastRoomState(room);
				io.to(targetId).emit("kicked");
				// also force them to leave room channel
				const targetSockets = io.sockets.adapter.rooms.get(targetId);
				if (targetSockets) {
					for (const sockId of targetSockets) {
						const s = io.sockets.sockets.get(sockId);
						if (s) s.leave(room.code);
					}
				}
			}
		});

		socket.on("leave_room", () => {
			const sessionId = socket.data.sessionId;
			if (!sessionId) return;

			for (const room of rooms.values()) {
				if (room.players.has(sessionId)) {
					room.removePlayer(sessionId);
					broadcastRoomState(room);
					socket.leave(room.code);
					socket.leave(sessionId);
				}
			}
			socket.data.sessionId = null;
		});

		// Allow manually checking state
		socket.on("request_state", ({ roomCode }) => {
			const room = rooms.get(roomCode.toUpperCase());
			const sessionId = socket.data.sessionId;
			if (room && sessionId && room.players.has(sessionId)) {
				io.to(sessionId).emit("room_state_update", room.getClientState(sessionId));
			}
		});
	});

	// Regular updates to sync timers every second
	setInterval(() => {
		for (const room of rooms.values()) {
			if (room.phase !== "Lobby" && room.phase !== "Reveal") {
				// Just broadcast state if there's a timer to sync
				broadcastRoomState(room);
			}
		}
	}, 1000);

	// Vite middleware for development
	if (process.env.NODE_ENV !== "production") {
		const { createServer: createViteServer } = await import("vite");
		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "spa",
		});
		app.use(vite.middlewares);
	} else {
		app.use(express.static(path.join(process.cwd(), "dist")));
		app.get("*", (req, res) => {
			res.sendFile(path.join(process.cwd(), "dist", "index.html"));
		});
	}

	httpServer.listen(PORT, "0.0.0.0", () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

startServer();
