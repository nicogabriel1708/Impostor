import { Eye, Ghost } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Timer } from "../components/Timer";
import { useGame } from "../store";

export function RoleRevealView() {
	const { roomState } = useGame();
	const [revealed, setRevealed] = useState(false);

	if (!roomState) return null;

	const isImpostor = roomState.myRole === "impostor";

	return (
		<div className="flex-1 flex flex-col p-6 relative">
			<div className="flex justify-between items-center bg-indigo-700/50 p-4 rounded-3xl mb-4 border-2 border-indigo-500/30">
				<h2 className="text-sm font-black tracking-widest text-indigo-200 uppercase">Role Reveal</h2>
				<Timer endsAt={roomState.timerEndsAt} />
			</div>

			<div className="flex-1 flex flex-col items-center justify-center -mt-12">
				<div
					className="w-full aspect-[3/4] max-w-sm cursor-pointer perspective-1000"
					onClick={() => setRevealed(!revealed)}
				>
					<motion.div
						className="w-full h-full relative preserve-3d"
						animate={{ rotateY: revealed ? 180 : 0 }}
						transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
					>
						{/* Front of card (Hidden state) */}
						<div className="absolute inset-0 backface-hidden bg-yellow-400 border-8 border-yellow-200 rounded-[40px] flex flex-col items-center justify-center space-y-6 shadow-2xl">
							<Eye className="w-20 h-20 text-indigo-900" strokeWidth={2.5} />
							<div className="text-center">
								<h3 className="text-4xl font-black text-indigo-900 uppercase italic tracking-tighter">
									Tap to Reveal
								</h3>
								<p className="text-indigo-800 font-bold mt-2 px-8 uppercase tracking-wider text-xs">
									Make sure nobody else is looking at your screen.
								</p>
							</div>
						</div>

						{/* Back of card (Revealed state) */}
						<div
							className={`absolute inset-0 backface-hidden rounded-[40px] flex flex-col items-center justify-center p-8 text-center shadow-2xl border-8 ${
								me?.isSpectator
									? "bg-indigo-500 border-indigo-300 text-white"
									: isImpostor
										? "bg-pink-500 border-pink-300 text-white"
										: "bg-white border-indigo-100 text-indigo-900"
							}`}
							style={{ transform: "rotateY(180deg)" }}
						>
							{me?.isSpectator ? (
								<>
									<Eye className="w-24 h-24 text-white mb-6 drop-shadow-xl" strokeWidth={3} />
									<h1 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">
										Spectator
									</h1>
									<p className="text-indigo-200 font-bold mb-8 uppercase tracking-widest text-sm">
										Wait for the next round.
									</p>
								</>
							) : isImpostor ? (
								<>
									<Ghost className="w-24 h-24 text-white mb-6 drop-shadow-xl" strokeWidth={3} />
									<h1 className="text-4xl font-black mb-2 uppercase italic tracking-tighter">
										You are the Impostor
									</h1>
									<p className="text-pink-100 font-bold mb-8 uppercase tracking-widest text-sm">
										Blend in. Don't get caught.
									</p>

									{roomState.myHint && (
										<div className="bg-pink-900/40 border-4 border-pink-400/50 rounded-[20px] p-4 w-full shadow-inner">
											<p className="text-xs font-black text-pink-200 uppercase tracking-widest mb-1">
												Intel
											</p>
											<p className="text-2xl font-black text-white">{roomState.myHint}</p>
										</div>
									)}
								</>
							) : (
								<>
									<div className="text-6xl mb-6 drop-shadow-xl">🤫</div>
									<h1 className="text-4xl font-black mb-2 uppercase italic tracking-tighter text-indigo-600">
										Civilian
									</h1>
									<p className="text-indigo-400 font-bold mb-8 uppercase tracking-widest text-sm">
										Find out who doesn't know the word.
									</p>

									<div className="bg-indigo-50 border-4 border-indigo-100 rounded-[20px] p-4 w-full shadow-inner">
										<p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">
											Category: {roomState.settings.category}
										</p>
										<p className="text-4xl font-black text-indigo-900 uppercase tracking-tighter">
											{roomState.myWord}
										</p>
									</div>
								</>
							)}
						</div>
					</motion.div>
				</div>
			</div>

			<p className="text-center text-sm font-bold text-indigo-200 uppercase tracking-widest pb-4">
				Game starts when the timer ends.
			</p>

			<style
				dangerouslySetInnerHTML={{
					__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `,
				}}
			/>
		</div>
	);
}
