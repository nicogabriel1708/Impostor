import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Timer } from "../components/Timer";
import { cn } from "../lib/utils";
import { useGame } from "../store";

export function VotingView() {
	const { roomState, sessionId, submitVote } = useGame();

	if (!roomState) return null;

	const me = roomState.players.find((p) => p.id === sessionId);

	const hasVoted = roomState.hasVoted;
	const isSpectator = me?.isSpectator;

	const handleVote = (targetId: string | null) => {
		if (!hasVoted && !isSpectator) {
			submitVote(targetId);
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6 h-full relative">
			<div className="flex flex-col mb-6 space-y-4">
				<div className="flex justify-between items-center bg-indigo-700/50 p-4 rounded-3xl border-2 border-indigo-500/30">
					<div>
						<h2 className="text-sm font-black tracking-widest text-indigo-200 uppercase">Voting Phase</h2>
						<p className="text-xl font-black text-white mt-1 uppercase italic tracking-tighter">
							{isSpectator ? "Spectating..." : "Who is the Impostor?"}
						</p>
					</div>
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
			</div>

			{hasVoted || isSpectator ? (
				<div className="flex-1 flex flex-col items-center justify-center space-y-4">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className="w-24 h-24 bg-yellow-400 text-indigo-900 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-yellow-200"
					>
						<CheckCircle2 className="w-12 h-12" strokeWidth={3} />
					</motion.div>
					<h3 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
						{isSpectator ? "Game in Progress" : "Vote Submitted"}
					</h3>
					<p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">
						{isSpectator ? "Waiting for the round to end..." : "Waiting for others..."}
					</p>
				</div>
			) : (
				<>
					<div className="bg-indigo-800/40 border-2 border-indigo-500/50 p-4 rounded-[20px] mb-4">
						<div className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">
							Your Clue
						</div>
						<div className="text-xl font-black text-white">
							{[...roomState.clues].reverse().find((c) => c.playerId === sessionId)?.clue ||
								"No clue given"}
						</div>
					</div>
					<div className="flex-1 overflow-y-auto pb-8 space-y-3">
						{roomState.players.map((p) => {
							if (p.id === sessionId) return null; // Can't vote for self
							if (p.isSpectator) return null; // Can't vote for spectators

							// Find their clue
							const theirClue =
								[...roomState.clues].reverse().find((c) => c.playerId === p.id)?.clue ||
								"No clue given";

							return (
								<button
									key={p.id}
									onClick={() => handleVote(p.id)}
									className="w-full bg-white hover:bg-indigo-50 border-b-4 border-indigo-200 p-4 rounded-[20px] flex items-center space-x-4 transition-transform active:translate-y-1 active:border-b-0 text-left group shadow-md"
								>
									<div
										className={cn(
											"w-14 h-14 rounded-[16px] flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-inner border-2 border-white/20",
											p.color,
										)}
									>
										{p.avatar}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-black text-xl text-indigo-900 truncate uppercase tracking-wider">
											{p.name}
										</div>
										{theirClue === "- Skipped -" ? (
											<div className="text-sm text-red-500 font-black uppercase tracking-widest truncate">
												{theirClue}
											</div>
										) : (
											<div className="text-sm text-indigo-400 font-bold italic truncate">
												"{theirClue}"
											</div>
										)}
									</div>
								</button>
							);
						})}

						<button
							onClick={() => handleVote(null)}
							className="w-full bg-indigo-900/40 border-4 border-dashed border-indigo-500/50 hover:border-indigo-400 p-4 rounded-[20px] flex items-center justify-center space-x-2 transition-all mt-6 active:scale-[0.98] text-indigo-300 hover:text-white"
						>
							<span className="font-black uppercase tracking-widest text-sm">Skip Vote</span>
						</button>
					</div>
				</>
			)}
		</div>
	);
}
