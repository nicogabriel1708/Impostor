import { HelpCircle, LogIn, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { useGame } from "../store";
import { RulesView } from "./RulesView";

export function HomeView() {
	const { createRoom, joinRoom, error, clearError } = useGame();
	const [joinCode, setJoinCode] = useState("");
	const [showRules, setShowRules] = useState(false);

	const handleJoin = (e: React.FormEvent) => {
		e.preventDefault();
		if (joinCode.trim().length === 4) {
			joinRoom(joinCode.trim().toUpperCase());
		}
	};

	return (
		<div className="flex-1 flex flex-col p-6">
			<div className="flex-1 flex flex-col items-center justify-center space-y-12">
				<motion.div
					initial={{ scale: 0.8, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className="flex flex-col items-center space-y-4"
				>
					<div className="w-24 h-24 bg-yellow-400 rounded-[30px] rotate-12 flex items-center justify-center shadow-inner">
						<span className="text-indigo-900 font-black text-6xl -rotate-12 italic">?</span>
					</div>
					<div className="text-center">
						<h1 className="text-5xl font-black tracking-tighter uppercase italic text-white mb-2">
							Impostor
						</h1>
						<p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">
							Find the spy. Or blend in.
						</p>
					</div>
				</motion.div>

				{error && (
					<div className="bg-red-500/20 border-2 border-red-500 text-red-100 px-4 py-3 rounded-2xl w-full text-center text-sm font-bold shadow-lg">
						{error}
						<button
							onClick={clearError}
							className="cursor-pointer ml-2 underline opacity-80 hover:opacity-100"
						>
							Dismiss
						</button>
					</div>
				)}

				<div className="w-full space-y-6">
					<button
						onClick={createRoom}
						className="cursor-pointer w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-5 px-6 rounded-3xl flex items-center justify-center space-x-2 transition-transform active:translate-y-1 shadow-xl border-b-4 border-pink-700 active:border-b-0 uppercase tracking-widest text-lg"
					>
						<Plus className="w-6 h-6" strokeWidth={3} />
						<span>Create Room</span>
					</button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t-2 border-indigo-500/50"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-indigo-600 text-indigo-300 font-bold uppercase tracking-widest">
								or join
							</span>
						</div>
					</div>

					<form onSubmit={handleJoin} className="flex space-x-3 w-full">
						<input
							type="text"
							placeholder="Code"
							maxLength={4}
							value={joinCode}
							onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
							className="flex-1 min-w-0 bg-white border-4 border-indigo-200 text-indigo-900 placeholder:text-indigo-300 rounded-[20px] px-4 py-4 font-mono text-xl sm:text-2xl font-black text-center tracking-[0.2em] focus:outline-none focus:border-yellow-400 uppercase transition-colors shadow-inner"
						/>
						<button
							type="submit"
							disabled={joinCode.trim().length !== 4}
							className="cursor-pointer shrink-0 bg-yellow-400 text-indigo-900 disabled:opacity-50 disabled:bg-indigo-800 disabled:text-indigo-400 hover:bg-yellow-300 disabled:border-transparent font-black px-6 rounded-[20px] flex items-center justify-center transition-transform active:translate-y-1 shadow-lg border-b-4 border-yellow-600 active:border-b-0"
						>
							<LogIn className="w-6 h-6" strokeWidth={3} />
						</button>
					</form>
				</div>
			</div>

			<div className="flex justify-center mt-auto pt-8 pb-2">
				<button
					onClick={() => setShowRules(true)}
					className="cursor-pointer text-indigo-300 hover:text-white font-bold uppercase tracking-widest text-xs flex items-center space-x-2 transition-colors"
				>
					<HelpCircle className="w-4 h-4" />
					<span>How to play</span>
				</button>
			</div>

			<AnimatePresence>{showRules && <RulesView onClose={() => setShowRules(false)} />}</AnimatePresence>
		</div>
	);
}
