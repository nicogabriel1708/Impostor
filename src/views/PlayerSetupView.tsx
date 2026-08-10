import { ArrowLeft, Check, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../lib/utils";
import { useGame } from "../store";

const AVATARS = [
	"🐶",
	"🐱",
	"🦊",
	"🐻",
	"🐼",
	"🐨",
	"🐯",
	"🦁",
	"🐮",
	"🐷",
	"🐸",
	"🐙",
	"🐢",
	"🦄",
	"🦖",
	"👽",
	"🎃",
	"🐟",
	"🤖",
	"🦋",
	"🐝",
	"🐞",
	"🦉",
	"🦇",
];

const COLORS = [
	"bg-rose-600",
	"bg-red-500",
	"bg-orange-500",
	"bg-amber-600",
	"bg-yellow-400",
	"bg-lime-400",
	"bg-green-700",
	"bg-teal-500",
	"bg-cyan-500",
	"bg-sky-400",
	"bg-blue-700",
	"bg-indigo-500",
	"bg-purple-700",
	"bg-fuchsia-400",
	"bg-pink-400",
	"bg-amber-900",
	"bg-gray-700",
	"bg-black",
];

export function PlayerSetupView() {
	const { updatePlayer, roomCode, leaveRoom, isCreator, roomState, sessionId } = useGame();
	const [name, setName] = useState("");
	const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
	const [color, setColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);
	const [showAllAvatars, setShowAllAvatars] = useState(false);
	const [showAllColors, setShowAllColors] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			updatePlayer(name, avatar, color);
		}
	};

	const visibleAvatars = showAllAvatars ? AVATARS : AVATARS.slice(0, 12);
	const visibleColors = showAllColors ? COLORS : COLORS.slice(0, 12);

	const nameExists = roomState?.players.some(
		(p) => p.id !== sessionId && p.name && p.name.toUpperCase() === name.trim().toUpperCase(),
	);

	return (
		<div className="flex-1 flex flex-col h-full relative overflow-y-auto">
			<button
				onClick={leaveRoom}
				className="cursor-pointer absolute top-6 left-6 p-3 bg-indigo-800 text-indigo-200 hover:bg-indigo-700 hover:text-white rounded-[16px] transition-all shadow-lg border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 z-10"
			>
				<ArrowLeft className="w-5 h-5" strokeWidth={3} />
			</button>

			<div className="flex-1 flex flex-col pb-6 min-h-max">
				<div className="text-center mt-6 mb-4 shrink-0 px-6 pt-12">
					<h2 className="text-xs font-bold tracking-widest text-indigo-300 uppercase">
						Room <span className="text-yellow-400 ml-1">{roomCode}</span>
					</h2>
					<h1 className="text-3xl font-black mt-1 tracking-tighter uppercase italic text-white">
						Who are you?
					</h1>
				</div>

				<form id="setup-form" onSubmit={handleSubmit} className="flex flex-col flex-1 px-6 space-y-5">
					<div className="flex flex-col shrink-0">
						<label className="text-xs font-bold text-indigo-200 uppercase tracking-widest pl-1 mb-2">
							Display Name
						</label>
						<input
							type="text"
							value={name.toUpperCase()}
							onChange={(e) => setName(e.target.value.toUpperCase())}
							maxLength={16}
							placeholder="Your name"
							className={cn(
								"w-full bg-white border-4 text-indigo-900 placeholder:text-indigo-300 rounded-[16px] px-4 py-3 font-black text-lg focus:outline-none transition-colors shadow-inner uppercase tracking-wider",
								nameExists
									? "border-red-400 focus:border-red-500 text-red-600"
									: "border-indigo-200 focus:border-yellow-400",
							)}
						/>
						{nameExists && (
							<div className="text-red-400 text-xs font-bold mt-2 pl-1 uppercase tracking-widest">
								Name already taken
							</div>
						)}
					</div>

					<div className="flex flex-col">
						<label className="text-xs font-bold text-indigo-200 uppercase tracking-widest pl-1 mb-2 shrink-0">
							Color
						</label>
						<div className="grid grid-cols-6 gap-4 sm:gap-5 px-3 py-4 -mx-3">
							{visibleColors.map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => setColor(c)}
									className={cn(
										"cursor-pointer aspect-square rounded-[16px] transition-all border-b-4 active:border-b-0 active:translate-y-1 hover:scale-105 shadow-md",
										c,
										color === c
											? "border-white/50 ring-4 ring-offset-2 ring-offset-indigo-600 ring-yellow-400 border-b-0 translate-y-1 z-10"
											: "border-black/20",
									)}
								/>
							))}
						</div>
						{COLORS.length > 12 && (
							<button
								type="button"
								onClick={() => setShowAllColors(!showAllColors)}
								className="mt-1 flex items-center justify-center space-x-1 text-[10px] font-bold text-indigo-300 uppercase tracking-widest hover:text-white transition-colors py-1"
							>
								<span>{showAllColors ? "Show Less" : "Show All"}</span>
								{showAllColors ? (
									<ChevronUp className="w-3 h-3" />
								) : (
									<ChevronDown className="w-3 h-3" />
								)}
							</button>
						)}
					</div>

					<div className="flex flex-col">
						<label className="text-xs font-bold text-indigo-200 uppercase tracking-widest pl-1 mb-2 shrink-0">
							Avatar
						</label>
						<div className="grid grid-cols-6 gap-4 sm:gap-5 px-3 py-4 -mx-3">
							{visibleAvatars.map((emoji) => (
								<button
									key={emoji}
									type="button"
									onClick={() => setAvatar(emoji)}
									className={cn(
										"cursor-pointer aspect-square text-3xl sm:text-4xl rounded-[16px] flex items-center justify-center transition-all",
										avatar === emoji
											? "bg-yellow-400 shadow-inner border-4 border-yellow-200 z-10 ring-4 ring-offset-2 ring-offset-indigo-600 ring-yellow-400/50 scale-105"
											: "bg-indigo-500 hover:bg-indigo-400 shadow-md border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 hover:scale-105",
									)}
								>
									{emoji}
								</button>
							))}
						</div>
						{AVATARS.length > 12 && (
							<button
								type="button"
								onClick={() => setShowAllAvatars(!showAllAvatars)}
								className="mt-1 flex items-center justify-center space-x-1 text-[10px] font-bold text-indigo-300 uppercase tracking-widest hover:text-white transition-colors py-1"
							>
								<span>{showAllAvatars ? "Show Less" : "Show All"}</span>
								{showAllAvatars ? (
									<ChevronUp className="w-3 h-3" />
								) : (
									<ChevronDown className="w-3 h-3" />
								)}
							</button>
						)}
					</div>

					<div className="mt-auto pt-6 pb-2 shrink-0">
						<button
							onClick={handleSubmit}
							disabled={!name.trim() || nameExists}
							className="cursor-pointer w-full bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50 disabled:bg-indigo-800 disabled:text-indigo-400 disabled:border-transparent font-black text-lg py-4 px-6 rounded-3xl flex items-center justify-center space-x-2 transition-transform active:translate-y-1 shadow-xl border-b-4 border-pink-700 active:border-b-0 uppercase tracking-widest"
						>
							<span>{isCreator ? "Create Room" : "Join Room"}</span>
							<Check className="w-6 h-6" strokeWidth={3} />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
