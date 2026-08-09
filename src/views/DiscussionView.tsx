import { MessageSquare, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { Timer } from "../components/Timer";
import { cn } from "../lib/utils";
import { useGame } from "../store";

export function DiscussionView() {
	const { roomState, sessionId, chatMessages, sendChatMessage } = useGame();
	const [chatInput, setChatInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [chatMessages]);

	if (!roomState) return null;

	const me = roomState.players.find((p) => p.id === sessionId);
	const isSpectator = me?.isSpectator;

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
					<Timer endsAt={roomState.timerEndsAt} />
				</div>

				{roomState.clues && roomState.clues.length > 0 && (
					<div className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
						{roomState.clues.map((c) => {
							const p = roomState.players.find((player) => player.id === c.playerId);
							if (!p) return null;
							return (
								<div
									key={p.id}
									className="flex-shrink-0 bg-white/10 rounded-2xl p-2 flex items-center space-x-3 border border-white/20 min-w-max"
								>
									<div
										className={cn(
											"w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner border-2 border-white/50",
											p.color,
										)}
									>
										{p.avatar}
									</div>
									<div className="flex flex-col pr-2">
										<span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-tight">
											{p.name}
										</span>
										<span
											className={cn(
												"text-sm font-bold uppercase tracking-wider",
												c.clue === "- Skipped -" ? "text-red-400" : "text-white",
											)}
										>
											{c.clue}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
				<AnimatePresence initial={false}>
					{chatMessages.map((msg) => {
						const p = roomState.players.find((player) => player.id === msg.playerId);
						const isMe = msg.playerId === sessionId;
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
									<div className="w-10 h-10 rounded-full bg-indigo-100/50 border-2 border-white flex items-center justify-center text-lg shrink-0 shadow-inner">
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
										<div className="text-[10px] font-black text-indigo-400 mb-0.5 uppercase tracking-wider">
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
