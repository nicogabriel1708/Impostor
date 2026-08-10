import { ChevronDown, ChevronUp, FastForward, MessageSquare, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Timer } from "../components/Timer";
import { cn } from "../lib/utils";
import { useGame } from "../store";

export function DiscussionView() {
	const { roomState, sessionId, chatMessages, sendChatMessage, toggleSkipDiscussion } = useGame();
	const [chatInput, setChatInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatMessages]);

	if (!roomState) return null;

	const me = roomState.players.find((p) => p.id === sessionId);
	const isSpectator = me?.isSpectator;

	const inputRef = React.useRef<HTMLInputElement>(null);
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
		if (chatInput.trim()) {
			sendChatMessage(chatInput.trim());
			setChatInput("");
		}
	};

	return (
		<div className="flex-1 flex flex-col relative h-full">
			<div className="p-6 pb-2 bg-indigo-600 z-10 sticky top-0 shadow-md flex flex-col space-y-4">
				<div className="flex justify-between items-center bg-indigo-700/50 p-4 rounded-3xl border-2 border-indigo-500/30">
					<div className="flex items-center space-x-2 text-indigo-200">
						<MessageSquare className="w-6 h-6" />
						<h2 className="text-sm font-black tracking-widest uppercase">Discussion</h2>
					</div>

					<button
						onClick={() => toggleSkipDiscussion()}
						className={cn(
							"px-4 py-2 rounded-2xl flex items-center space-x-2 text-xs font-black uppercase tracking-widest transition-colors border-2",
							me?.wantsToSkipDiscussion
								? "bg-yellow-400 border-yellow-500 text-indigo-900"
								: "bg-indigo-800 border-indigo-500 text-indigo-200 hover:bg-indigo-700",
						)}
					>
						<span>Skip</span>
						<div className="bg-black/20 px-2 py-0.5 rounded-full">
							{roomState.players.filter((p) => p.wantsToSkipDiscussion).length}/
							{roomState.players.filter((p) => !p.isSpectator).length}
						</div>
						<FastForward className="w-4 h-4" />
					</button>
					<Timer endsAt={roomState.timerEndsAt} />
				</div>

				<div className="bg-indigo-900/40 p-3 rounded-2xl border-2 border-dashed border-indigo-500/50 flex flex-col items-center justify-center">
					<span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
						{roomState.secretCategory || roomState.settings.category}
					</span>
					<span className="text-lg font-black text-white">
						{roomState.myWord ||
							roomState.myHint ||
							(me?.isSpectator ? "Spectating" : "You are the Impostor")}
					</span>
				</div>

				{roomState.clues && roomState.clues.length > 0 && (
					<CluesDropdown clues={roomState.clues} players={roomState.players} />
				)}
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
				<AnimatePresence initial={false}>
					{chatMessages.map((msg) => {
						const p = roomState.players.find((player) => player.id === msg.playerId);
						const isMe = msg.playerId === sessionId;
						const textColorClass = p?.color ? p.color.replace("bg-", "text-") : "text-indigo-400";
						return (
							<motion.div
								key={msg.id}
								initial={{ opacity: 0, scale: 0.95, originY: 1 }}
								animate={{ opacity: 1, scale: 1 }}
								className={cn(
									"flex items-end space-x-2",
									isMe ? "flex-row-reverse space-x-reverse" : "flex-row",
								)}
							>
								{!isMe && (
									<div
										className={cn(
											"w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-lg shrink-0 shadow-inner",
											p?.color,
										)}
									>
										{p?.avatar}
									</div>
								)}
								<div
									className={cn(
										"max-w-[75%] px-4 py-3 rounded-[20px] text-sm font-bold shadow-sm border-2",
										isMe
											? "bg-indigo-500 text-white rounded-br-sm border-indigo-400"
											: "bg-white text-indigo-900 rounded-bl-sm border-indigo-100",
									)}
								>
									{!isMe && (
										<div
											className={cn(
												"text-[10px] font-black mb-0.5 uppercase tracking-wider",
												textColorClass,
											)}
										>
											{p?.name}
										</div>
									)}
									<div className="break-words">{msg.text}</div>
								</div>
							</motion.div>
						);
					})}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			<div className="absolute bottom-0 left-0 right-0 p-4 bg-indigo-600 border-t-4 border-indigo-500/30">
				{isSpectator ? (
					<div className="bg-indigo-700/50 rounded-full px-5 py-3 text-center border-4 border-indigo-500/30">
						<span className="text-indigo-200 font-bold text-sm uppercase tracking-widest">
							Spectators cannot chat
						</span>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="flex space-x-2">
						<input
							ref={inputRef}
							type="text"
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							maxLength={100}
							placeholder="Say something..."
							className="flex-1 bg-white border-4 border-indigo-200 text-indigo-900 placeholder:text-indigo-300 rounded-full px-5 py-3 font-bold text-sm focus:outline-none focus:border-yellow-400 shadow-inner"
						/>
						<button
							type="submit"
							disabled={!chatInput.trim()}
							className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:bg-indigo-800 disabled:border-transparent text-white w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform active:translate-y-1 shadow-lg border-b-4 border-pink-700 active:border-b-0"
						>
							<Send className="w-5 h-5 -ml-0.5" strokeWidth={3} />
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

function CluesDropdown({ clues, players }: { clues: any[]; players: any[] }) {
	const [isOpen, setIsOpen] = useState(false);

	const cluesByRound = clues.reduce(
		(acc, clue) => {
			const r = clue.round || 0;
			if (!acc[r]) acc[r] = [];
			acc[r].push(clue);
			return acc;
		},
		{} as Record<number, typeof clues>,
	);

	const rounds = Object.keys(cluesByRound)
		.map(Number)
		.sort((a, b) => b - a);

	return (
		<div className="bg-indigo-900/40 rounded-2xl border-2 border-indigo-500/50 overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full p-3 flex items-center justify-between text-indigo-200 hover:bg-indigo-800/50 transition-colors"
			>
				<span className="text-xs font-black uppercase tracking-widest">View All Clues ({clues.length})</span>
				{isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ height: 0 }}
						animate={{ height: "auto" }}
						exit={{ height: 0 }}
						className="overflow-hidden"
					>
						<div className="p-3 pt-0 max-h-48 overflow-y-auto space-y-4">
							{rounds.map((round) => (
								<div key={round} className="space-y-2">
									<div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/30 pb-1">
										Round {round}
									</div>
									<div className="grid grid-cols-2 gap-2">
										{cluesByRound[round].map((c: any, i: number) => {
											const p = players.find((player) => player.id === c.playerId);
											if (!p) return null;
											return (
												<div
													key={i}
													className="bg-indigo-800/40 rounded-xl p-2 flex items-center space-x-2 border border-indigo-500/30"
												>
													<div
														className={cn(
															"w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-inner",
															p.color,
														)}
													>
														{p.avatar}
													</div>
													<div className="flex flex-col min-w-0">
														<span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-tight truncate">
															{p.name}
														</span>
														<span
															className={cn(
																"text-xs font-bold uppercase tracking-wider truncate",
																c.clue === "- Skipped -"
																	? "text-red-400"
																	: "text-white",
															)}
														>
															{c.clue}
														</span>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
