import { ArrowRight, Ghost, Users } from "lucide-react";
import { motion } from "motion/react";
import { Timer } from "../components/Timer";
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

	const isContinues = result.gameContinues;
	const title = isContinues
		? didTie
			? "It's a Tie!"
			: "Voting Results"
		: didTie
			? "It's a Tie!"
			: didPlayersWin
				? "Players Win!"
				: "Impostors Win!";

	const bgColor = isContinues
		? didTie
			? "bg-indigo-600"
			: "bg-indigo-600"
		: didTie
			? "bg-yellow-400"
			: didPlayersWin
				? "bg-indigo-500"
				: "bg-pink-500";
	const textColor = didTie && !isContinues ? "text-indigo-900" : "text-white";

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<div className={cn("p-8 pb-12 flex flex-col items-center justify-center text-center shadow-md", bgColor)}>
				<motion.div
					initial={{ scale: 0.5, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", bounce: 0.5 }}
				>
					<div className="inline-flex flex-col items-start text-left mb-4">
						{didPlayersWin ? (
							<Users className={cn("w-24 h-24 mb-4 drop-shadow-md", textColor)} strokeWidth={2.5} />
						) : (
							<Ghost className={cn("w-24 h-24 mb-4 drop-shadow-md", textColor)} strokeWidth={2.5} />
						)}
						<h1 className={cn("text-5xl font-black uppercase italic tracking-tighter", textColor)}>
							{title}
						</h1>
					</div>
					{!isContinues && (
						<p
							className={cn(
								"text-lg font-bold uppercase tracking-wider",
								didTie ? "text-indigo-800" : "text-white/80",
							)}
						>
							The word was <strong className={cn("font-black", textColor)}>"{result.word}"</strong>
						</p>
					)}

					{isContinues && result.eliminatedPlayerIds.length > 0 && (
						<div className="mt-6 flex flex-col space-y-3 w-full max-w-sm mx-auto">
							{result.eliminatedPlayerIds.map((id) => {
								const p = roomState.players.find((x) => x.id === id);
								if (!p) return null;
								const role = result.eliminatedRoles?.[id];
								const isImpostor = role === "impostor";
								return (
									<div
										key={id}
										className={cn(
											"flex items-center space-x-3 p-3 rounded-[20px] border-4 shadow-sm text-left",
											isImpostor
												? "bg-pink-500/20 border-pink-400/50"
												: "bg-emerald-500/20 border-emerald-400/50",
										)}
									>
										<div
											className={cn(
												"w-12 h-12 rounded-[14px] flex items-center justify-center text-xl shrink-0 shadow-inner",
												p.color,
											)}
										>
											{p.avatar}
										</div>
										<div className="flex flex-col min-w-0 space-y-2 py-0.5">
											<span className="font-black text-white uppercase tracking-wider text-base truncate leading-none">
												{p.name}
											</span>
											<span
												className={cn(
													"text-xs font-black uppercase tracking-widest leading-none",
													isImpostor ? "text-pink-300" : "text-emerald-300",
												)}
											>
												{isImpostor ? "Was an impostor!" : "Was NOT an impostor!"}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
					{isContinues && result.eliminatedPlayerIds.length === 0 && (
						<div className="mt-4 text-lg font-bold uppercase tracking-wider text-white/90 bg-indigo-900/40 p-3 rounded-2xl border-2 border-indigo-400">
							No one was eliminated!
						</div>
					)}
					{isContinues && (
						<p className="text-lg font-bold uppercase tracking-wider text-white/80">
							The game continues...
						</p>
					)}
				</motion.div>
			</div>

			<div className="p-6 space-y-8 flex-1">
				{/* Impostor Reveal */}
				{!isContinues && (
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
										<div
											className={cn(
												"w-16 h-16 text-3xl rounded-[20px] flex items-center justify-center shadow-inner",
												p.color,
											)}
										>
											{p.avatar}
										</div>
										<div className="font-black text-indigo-900 uppercase tracking-wider">
											{p.name}
										</div>
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
				)}

				{/* Vote Results */}
				<div className={cn("space-y-4", !isContinues && "pt-6 border-t-4 border-indigo-500/20")}>
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
												<div
													className={cn(
														"w-12 h-12 text-2xl rounded-[16px] flex items-center justify-center shadow-inner",
														target.color || "bg-indigo-200",
													)}
												>
													{target.avatar}
												</div>
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
														<span
															className={cn(
																"w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
																voter.color,
															)}
														>
															{voter.avatar}
														</span>
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
				{isContinues ? (
					<div className="w-full bg-indigo-900/40 text-indigo-200 font-bold flex flex-col items-center justify-center py-5 px-6 rounded-[20px] border-4 border-dashed border-indigo-500/50 uppercase tracking-widest text-sm space-y-2">
						<span>Next round starting in</span>
						<div className="scale-125">
							<Timer endsAt={roomState.timerEndsAt} />
						</div>
					</div>
				) : isHost ? (
					<button
						onClick={nextRound}
						className="cursor-pointer w-full bg-pink-500 hover:bg-pink-600 text-white font-black text-xl py-5 px-6 rounded-3xl flex items-center justify-center space-x-2 transition-transform active:translate-y-1 shadow-xl border-b-4 border-pink-700 active:border-b-0 uppercase tracking-widest"
					>
						<span>Back to Lobby</span>
						<ArrowRight className="w-6 h-6" strokeWidth={3} />
					</button>
				) : (
					<div className="w-full bg-indigo-900/40 text-indigo-200 font-bold text-center py-5 px-6 rounded-[20px] border-4 border-dashed border-indigo-500/50 uppercase tracking-widest text-sm">
						Waiting for host to return to lobby...
					</div>
				)}
			</div>
		</div>
	);
}
