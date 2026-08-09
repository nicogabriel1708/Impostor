import { ArrowLeft, Check, Copy, Crown, Play, Settings, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useGame } from "../store";
import { CATEGORIES } from "../words";

export function LobbyView() {
	const { roomState, sessionId, updateSettings, startGame, leaveRoom } = useGame();
	const [copied, setCopied] = useState(false);

	if (!roomState) return null;

	const me = roomState.players.find((p) => p.id === sessionId);
	const isHost = me?.isHost || false;

	const canStart = roomState.players.length >= 3 && roomState.players.filter((p) => !p.isSpectator).length >= 3;

	const handleCopy = () => {
		navigator.clipboard.writeText(roomState.code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex-1 flex flex-col p-6 overflow-y-auto relative">
			<button
				onClick={leaveRoom}
				className="absolute top-6 left-6 p-3 bg-indigo-800 text-indigo-200 hover:bg-indigo-700 hover:text-white rounded-[16px] transition-all shadow-lg border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 z-10"
			>
				<ArrowLeft className="w-5 h-5" strokeWidth={3} />
			</button>

			<div className="flex flex-col items-center mb-4 mt-12">
				<h2 className="text-xs font-bold tracking-widest text-indigo-200 uppercase mb-2">Room Code</h2>
				<button
					onClick={handleCopy}
					className="flex items-center space-x-4 bg-indigo-900/40 hover:bg-indigo-800/60 transition-colors px-6 py-3 rounded-2xl border border-white/10 shadow-inner group active:scale-95 relative"
				>
					<span className="text-4xl font-mono font-black tracking-[0.2em] text-yellow-400 ml-[0.2em]">
						{roomState.code}
					</span>
					{copied ? (
						<Check className="w-6 h-6 text-green-400 transition-colors" />
					) : (
						<Copy className="w-6 h-6 text-indigo-400 group-hover:text-yellow-400 transition-colors" />
					)}
					{copied && (
						<span className="absolute -top-8 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
							Copied!
						</span>
					)}
				</button>
			</div>

			<div className="flex items-center justify-between mb-8 mt-8 px-1">
				<div className="flex items-center space-x-2">
					<Users className="w-5 h-5 text-indigo-300" />
					<h2 className="text-sm font-bold tracking-widest text-indigo-200 uppercase pt-0.5">Players</h2>
				</div>
				<div className="flex items-center space-x-1">
					<span className="font-mono font-black text-white text-lg">{roomState.players.length}</span>
					<span className="font-mono font-bold text-indigo-400 text-lg">/12</span>
				</div>
			</div>

			<div className="grid grid-cols-4 gap-x-3 gap-y-10 mb-8">
				{roomState.players.map((p) => (
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						key={p.id}
						className="flex flex-col items-center space-y-2"
					>
						<div
							className={cn(
								"w-16 h-16 text-3xl rounded-[20px] flex items-center justify-center shadow-lg border-2 relative",
								p.color || "bg-indigo-800/50",
								p.id === sessionId ? "border-white" : "border-indigo-900/20",
								!p.connected && "opacity-50 grayscale",
							)}
						>
							{p.avatar}
							{p.isHost && (
								<div className="absolute -top-2 -right-2 bg-yellow-400 text-indigo-900 rounded-full p-1 shadow-lg border-2 border-yellow-200 z-10">
									<Crown className="w-3 h-3" strokeWidth={3} />
								</div>
							)}
						</div>
						<span className="text-xs font-bold truncate w-full text-center text-indigo-100">{p.name}</span>
					</motion.div>
				))}
				{/* Empty slots placeholders */}
				{Array.from({ length: Math.max(0, 3 - roomState.players.length) }).map((_, i) => (
					<div key={`empty-${i}`} className="flex flex-col items-center space-y-2 opacity-40">
						<div className="w-16 h-16 rounded-[20px] border-2 border-dashed border-indigo-400/50 bg-indigo-900/20 flex items-center justify-center"></div>
						<span className="text-xs font-bold truncate w-full text-center text-indigo-300">
							Waiting...
						</span>
					</div>
				))}
			</div>

			<div className="bg-white rounded-[30px] p-6 mb-8 flex-1 text-indigo-900 shadow-xl flex flex-col justify-center">
				<div className="flex items-center space-x-2 mb-6 pb-4 border-b-2 border-indigo-100">
					<Settings className="w-6 h-6 text-indigo-400" />
					<h3 className="font-black text-xl uppercase tracking-wider italic">Game Settings</h3>
				</div>

				<div className="space-y-6">
					<div>
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex justify-between mb-3">
							<span>Impostors</span>
						</label>
						{isHost ? (
							<div className="flex space-x-2">
								{[1, 2, 3].map((count) => (
									<button
										key={count}
										onClick={() => updateSettings({ impostorCount: count })}
										disabled={count > Math.max(1, Math.floor(roomState.players.length / 2))}
										className={cn(
											"flex-1 py-3 text-sm font-black rounded-xl border-2 transition-colors",
											roomState.settings.impostorCount === count
												? "bg-yellow-400 border-yellow-500 text-indigo-900 shadow-inner"
												: "bg-indigo-50 border-indigo-200 text-indigo-400 hover:bg-indigo-100 disabled:opacity-50",
										)}
									>
										{count}
									</button>
								))}
							</div>
						) : (
							<div className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-xl px-4 py-3 font-bold text-indigo-900 shadow-inner">
								{roomState.settings.impostorCount}
							</div>
						)}
					</div>

					<div>
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex justify-between mb-3">
							<span>Turn Time</span>
							<span className="text-indigo-900">{roomState.settings.clueTimeLimit}s</span>
						</label>
						{isHost ? (
							<input
								type="range"
								min="10"
								max="120"
								step="10"
								value={roomState.settings.clueTimeLimit}
								onChange={(e) => updateSettings({ clueTimeLimit: parseInt(e.target.value) })}
								className="w-full accent-yellow-500"
							/>
						) : (
							<div className="h-3 bg-indigo-100 rounded-full overflow-hidden shadow-inner">
								<div
									className="h-full bg-yellow-400"
									style={{ width: `${(roomState.settings.clueTimeLimit / 120) * 100}%` }}
								></div>
							</div>
						)}
					</div>

					<div>
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex justify-between mb-3">
							<span>Vote Time</span>
							<span className="text-indigo-900">{roomState.settings.discussionTimeLimit}s</span>
						</label>
						{isHost ? (
							<input
								type="range"
								min="30"
								max="300"
								step="30"
								value={roomState.settings.discussionTimeLimit}
								onChange={(e) => updateSettings({ discussionTimeLimit: parseInt(e.target.value) })}
								className="w-full accent-yellow-500"
							/>
						) : (
							<div className="h-3 bg-indigo-100 rounded-full overflow-hidden shadow-inner">
								<div
									className="h-full bg-yellow-400"
									style={{ width: `${(roomState.settings.discussionTimeLimit / 300) * 100}%` }}
								></div>
							</div>
						)}
					</div>

					<div>
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center mb-3">
							<span>Word Category</span>
						</label>
						{isHost ? (
							<select
								value={roomState.settings.category}
								onChange={(e) => updateSettings({ category: e.target.value })}
								className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 font-bold text-indigo-900 appearance-none shadow-sm focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
							>
								<option value="All">All</option>
								{Object.keys(CATEGORIES).map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						) : (
							<div className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-xl px-4 py-3 font-bold text-indigo-900 shadow-inner">
								{roomState.settings.category}
							</div>
						)}
					</div>

					<div className="space-y-3">
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center">
							<span>Round Mode</span>
						</label>
						{isHost ? (
							<div className="grid grid-cols-2 gap-3">
								<button
									onClick={() => updateSettings({ roundMode: "short" })}
									className={cn(
										"p-3 rounded-xl border-2 text-left transition-all",
										roomState.settings.roundMode === "short"
											? "bg-yellow-400 border-yellow-500 shadow-inner"
											: "bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
									)}
								>
									<div
										className={cn(
											"text-sm font-black uppercase tracking-widest mb-1",
											roomState.settings.roundMode === "short"
												? "text-indigo-900"
												: "text-indigo-900",
										)}
									>
										Short
									</div>
									<div
										className={cn(
											"text-xs font-bold leading-tight",
											roomState.settings.roundMode === "short"
												? "text-indigo-800"
												: "text-indigo-400",
										)}
									>
										One vote only.
									</div>
								</button>
								<button
									onClick={() => updateSettings({ roundMode: "long" })}
									className={cn(
										"p-3 rounded-xl border-2 text-left transition-all",
										roomState.settings.roundMode === "long"
											? "bg-yellow-400 border-yellow-500 shadow-inner"
											: "bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
									)}
								>
									<div
										className={cn(
											"text-sm font-black uppercase tracking-widest mb-1",
											roomState.settings.roundMode === "long"
												? "text-indigo-900"
												: "text-indigo-900",
										)}
									>
										Long
									</div>
									<div
										className={cn(
											"text-xs font-bold leading-tight",
											roomState.settings.roundMode === "long"
												? "text-indigo-800"
												: "text-indigo-400",
										)}
									>
										Play until Impostors lose.
									</div>
								</button>
							</div>
						) : (
							<div className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-xl px-4 py-3 shadow-inner flex flex-col">
								<span className="font-bold text-indigo-900 uppercase tracking-widest text-sm">
									{roomState.settings.roundMode === "short" ? "Short" : "Long"}
								</span>
								<span className="text-xs text-indigo-400 font-bold">
									{roomState.settings.roundMode === "short"
										? "One vote only."
										: "Play until Impostors lose."}
								</span>
							</div>
						)}
					</div>

					<div>
						<label className="text-xs font-black text-indigo-400 uppercase tracking-widest flex justify-between items-center mb-3">
							<span>Hints for Impostors</span>
							{isHost && (
								<button
									onClick={() =>
										updateSettings({
											hintMode: roomState.settings.hintMode === "none" ? "vague" : "none",
										})
									}
									className={cn(
										"w-12 h-6 rounded-full transition-colors relative flex-shrink-0",
										roomState.settings.hintMode !== "none" ? "bg-yellow-400" : "bg-indigo-200",
									)}
								>
									<div
										className={cn(
											"absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
											roomState.settings.hintMode !== "none" ? "left-7" : "left-1",
										)}
									/>
								</button>
							)}
						</label>
						{!isHost && (
							<div className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-xl px-4 py-3 font-bold text-indigo-900 shadow-inner">
								{roomState.settings.hintMode !== "none" ? "Enabled" : "Disabled"}
							</div>
						)}
					</div>
				</div>
			</div>

			{isHost ? (
				<button
					onClick={startGame}
					disabled={!canStart}
					className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:bg-indigo-800 disabled:text-indigo-400 disabled:border-transparent text-white font-black text-xl py-5 px-6 rounded-3xl flex items-center justify-center space-x-2 transition-transform active:translate-y-1 shadow-xl border-b-4 border-pink-700 active:border-b-0 uppercase tracking-widest mt-auto shrink-0"
				>
					<span>Start Game</span>
					<Play className="w-6 h-6 fill-current" />
				</button>
			) : (
				<div className="w-full bg-indigo-900/50 text-indigo-200 font-bold text-center py-5 px-6 rounded-[20px] border-2 border-indigo-500/50 mt-auto shrink-0 uppercase tracking-widest">
					Waiting for host to start...
				</div>
			)}
		</div>
	);
}
