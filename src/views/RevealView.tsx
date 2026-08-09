import { ArrowRight, Ghost, Users } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { useGame } from "../store";

export function RevealView() {
	const { roomState, sessionId, nextRound } = useGame();

	if (!roomState || !roomState.revealResult) return null;

	const result = roomState.revealResult;
	const me = roomState.players.find((p) => p.id === sessionId);
	const isHost = me?.isHost || false;

	const didPlayersWin = result.winners === "players";
	const didTie = result.winners === "tie";

	const title = didTie ? "It's a Tie!" : didPlayersWin ? "Players Win!" : "Impostors Win!";

	const bgColor = didTie ? "bg-yellow-400" : didPlayersWin ? "bg-indigo-500" : "bg-pink-500";
	const textColor = didTie ? "text-indigo-900" : "text-white";

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<div className={cn("p-8 pb-12 flex flex-col items-center justify-center text-center shadow-md", bgColor)}>
				<motion.div
					initial={{ scale: 0.5, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", bounce: 0.5 }}
				>
					{didPlayersWin ? (
						<Users className={cn("w-24 h-24 mb-4 drop-shadow-md", textColor)} strokeWidth={2.5} />
					) : (
						<Ghost className={cn("w-24 h-24 mb-4 drop-shadow-md", textColor)} strokeWidth={2.5} />
					)}
					<h1 className={cn("text-5xl font-black mb-2 uppercase italic tracking-tighter", textColor)}>
						{title}
					</h1>
					<p
						className={cn(
							"text-lg font-bold uppercase tracking-wider",
							didTie ? "text-indigo-800" : "text-white/80",
						)}
					>
						The word was <strong className={cn("font-black", textColor)}>"{result.word}"</strong>
					</p>
				</motion.div>
			</div>

			<div className="p-6 space-y-8 flex-1">
				{/* Impostor Reveal */}
				<div className="space-y-4">
					<h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest text-center">
						{result.impostors.length > 1 ? "The Impostors were" : "The Impostor was"}
					</h3>
					<div className="flex flex-wrap justify-center gap-3">
						{result.impostors.map((impId) => {
							const p = roomState.players.find((p) => p.id === impId);
							if (!p) return null;
							const eliminated = result.eliminatedPlayerIds.includes(impId);
							return (
								<div
									key={impId}
									className={cn(
										"bg-white rounded-[20px] p-4 flex flex-col items-center space-y-2 border-4 shadow-sm",
										eliminated ? "border-pink-500" : "border-indigo-100",
									)}
								>
									<div className="text-4xl">{p.avatar}</div>
									<div className="font-black text-indigo-900 uppercase tracking-wider">{p.name}</div>
									{eliminated && (
										<div className="text-xs font-black text-pink-500 uppercase tracking-widest">
											Eliminated
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Vote Results */}
				<div className="space-y-4 pt-6 border-t-4 border-indigo-500/20">
					<h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4">
						Voting Results
					</h3>
					<div className="space-y-3">
						{result.votes
							.sort((a, b) => b.voterIds.length - a.voterIds.length)
							.map((v, i) => {
								const target =
									v.playerId === "skip"
										? { name: "Skipped", avatar: "⏭️" }
										: roomState.players.find((p) => p.id === v.playerId);
								if (!target) return null;

								const isEliminated = result.eliminatedPlayerIds.includes(v.playerId);

								return (
									<div
										key={v.playerId}
										className={cn(
											"bg-white rounded-[20px] p-4 flex flex-col space-y-3 shadow-sm border-2",
											isEliminated ? "border-pink-400 bg-pink-50" : "border-indigo-100",
										)}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<div className="text-3xl">{target.avatar}</div>
												<div
													className={cn(
														"font-black text-lg uppercase tracking-wider",
														isEliminated ? "text-pink-900" : "text-indigo-900",
													)}
												>
													{target.name}
												</div>
											</div>
											<div
												className={cn(
													"flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-inner",
													isEliminated
														? "bg-pink-200 text-pink-900"
														: "bg-indigo-100 text-indigo-600",
												)}
											>
												<span>{v.voterIds.length}</span>
												<span>vote{v.voterIds.length !== 1 ? "s" : ""}</span>
											</div>
										</div>

										<div className="flex flex-wrap gap-2 pl-12">
											{v.voterIds.map((voterId) => {
												const voter = roomState.players.find((p) => p.id === voterId);
												return voter ? (
													<div
														key={voterId}
														className="flex items-center space-x-1 bg-indigo-50 border-2 border-indigo-100 rounded-full px-2 py-0.5 text-xs font-bold text-indigo-500 shadow-sm"
													>
														<span>{voter.avatar}</span>
														<span className="uppercase tracking-wider">{voter.name}</span>
													</div>
												) : null;
											})}
										</div>
									</div>
								);
							})}
					</div>
				</div>
			</div>

			<div className="p-6 pt-0 mt-auto">
				{isHost ? (
					<button
						onClick={nextRound}
						className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black text-xl py-5 px-6 rounded-3xl flex items-center justify-center space-x-2 transition-transform active:translate-y-1 shadow-xl border-b-4 border-pink-700 active:border-b-0 uppercase tracking-widest"
					>
						<span>Next Round</span>
						<ArrowRight className="w-6 h-6" strokeWidth={3} />
					</button>
				) : (
					<div className="w-full bg-indigo-900/40 text-indigo-200 font-bold text-center py-5 px-6 rounded-[20px] border-4 border-dashed border-indigo-500/50 uppercase tracking-widest text-sm">
						Waiting for host to start next round...
					</div>
				)}
			</div>
		</div>
	);
}
