import { CheckCircle2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Timer } from "../components/Timer";
import { cn } from "../lib/utils";
import { useGame } from "../store";

export function CluePhaseView() {
	const { roomState, sessionId, submitClue } = useGame();
	const [clueInput, setClueInput] = useState("");

	if (!roomState) return null;
	console.log("CluePhaseView roomState:", roomState.myWord, roomState.settings.category, roomState);

	const isMyTurn = roomState.currentTurnPlayerId === sessionId;
	const currentTurnPlayer = roomState.players.find((p) => p.id === roomState.currentTurnPlayerId);
	const me = roomState.players.find((p) => p.id === sessionId);

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isMyTurn) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isMyTurn]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if pressing modifier keys or if already focused on an input
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

			// If it's a character key, focus the input
			if (e.key.length === 1 && inputRef.current) {
				inputRef.current.focus();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (clueInput.trim() && isMyTurn) {
			submitClue(clueInput.trim());
			setClueInput("");
		}
	};

	return (
		<div className="flex-1 flex flex-col relative h-full">
			<div className="p-6 pb-4 bg-indigo-600 z-10 sticky top-0 shadow-md">
				<div className="flex justify-between items-center bg-indigo-700/50 p-4 rounded-3xl border-2 border-indigo-500/30">
					<div className="flex flex-col">
						<h2 className="text-sm font-black tracking-widest text-indigo-200 uppercase">Clue Phase</h2>
					</div>
					<Timer endsAt={roomState.timerEndsAt} />
				</div>

				<div className="bg-indigo-900/40 p-3 rounded-2xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center mt-4">
					<span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
						{roomState.secretCategory || roomState.settings.category}
					</span>
					<span className="text-lg font-black text-white">
						{roomState.myWord ||
							roomState.myHint ||
							(me?.isSpectator ? roomState.secretWord : "You are the Impostor")}
					</span>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
				<AnimatePresence initial={false}>
					{(roomState.clues || [])
						.filter((c) => c.round === (roomState.roundCount || 1))
						.map((c, i) => {
							const p = roomState.players.find((player) => player.id === c.playerId);
							return (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className={cn(
										"p-4 rounded-[20px] flex items-start space-x-3 shadow-md border-2",
										c.playerId === sessionId
											? "bg-indigo-500 border-indigo-400"
											: "bg-white border-indigo-100 text-indigo-900",
									)}
								>
									<div
										className={cn(
											"w-12 h-12 rounded-[16px] flex items-center justify-center text-2xl shrink-0 shadow-inner border-2 border-white/20",
											p?.color,
										)}
									>
										{p?.avatar}
									</div>
									<div className="flex-1 min-w-0">
										<div
											className={cn(
												"text-xs font-black uppercase tracking-widest mb-1",
												c.playerId === sessionId ? "text-indigo-200" : "text-indigo-400",
											)}
										>
											{p?.name}
										</div>
										<div
											className={cn(
												"text-xl font-black break-words",
												c.clue === "- Skipped -"
													? "text-red-500"
													: c.playerId === sessionId
														? "text-white"
														: "text-indigo-900",
											)}
										>
											{c.clue}
										</div>
									</div>
								</motion.div>
							);
						})}
				</AnimatePresence>

				{currentTurnPlayer && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="p-4 rounded-[30px] border-4 border-dashed border-indigo-400 bg-indigo-500/20 flex flex-col items-center justify-center space-y-2 py-8"
					>
						<div
							className={cn(
								"w-16 h-16 rounded-[20px] text-3xl flex items-center justify-center animate-bounce shadow-inner border-2 border-white/20",
								currentTurnPlayer.color,
							)}
						>
							{currentTurnPlayer.avatar}
						</div>
						<div className="text-sm font-black text-indigo-200 uppercase tracking-widest">
							Waiting for {isMyTurn ? "you" : currentTurnPlayer.name}...
						</div>
					</motion.div>
				)}
			</div>

			{/* Input Area */}
			<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-indigo-600 via-indigo-600 to-transparent pt-12">
				<div className="bg-white rounded-[30px] p-5 shadow-2xl border-4 border-indigo-200">
					{isMyTurn ? (
						<form onSubmit={handleSubmit} className="flex flex-col space-y-3">
							<label className="text-xs font-black text-pink-500 uppercase tracking-widest pl-1">
								Your Turn: Enter a clue
							</label>
							<div className="flex space-x-2">
								<input
									ref={inputRef}
									type="text"
									value={clueInput}
									onChange={(e) => setClueInput(e.target.value)}
									maxLength={30}
									autoFocus
									placeholder="One word ideally..."
									className="flex-1 bg-indigo-50 border-4 border-indigo-100 text-indigo-900 placeholder:text-indigo-300 rounded-[20px] px-4 py-3 font-black text-lg focus:outline-none focus:border-yellow-400 shadow-inner"
								/>
								<button
									type="submit"
									disabled={!clueInput.trim()}
									className="cursor-pointer bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:bg-indigo-100 text-indigo-900 p-4 rounded-[20px] flex items-center justify-center transition-transform active:translate-y-1 shadow-lg border-b-4 border-yellow-600 active:border-b-0 disabled:border-transparent"
								>
									<Send className="w-6 h-6" strokeWidth={3} />
								</button>
							</div>
						</form>
					) : (
						<div className="flex items-center justify-center space-x-3 py-4 text-indigo-300 font-black uppercase tracking-widest">
							<CheckCircle2 className="w-6 h-6" strokeWidth={3} />
							<span>{me?.isSpectator ? "You are a spectator" : "Not your turn"}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
