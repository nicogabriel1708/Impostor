import { ArrowLeft, CheckCircle2, EyeOff, MessageSquare, Users } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export function RulesView({ onClose }: { onClose: () => void }) {
	const rules = [
		{
			title: "1. Roles",
			desc: "Every player gets a secret word, except the Impostor, who gets nothing. Keep your role a secret!",
			icon: <EyeOff className="w-8 h-8 text-pink-500" strokeWidth={2.5} />,
			color: "border-pink-200 bg-pink-50",
		},
		{
			title: "2. Clues",
			desc: "Players take turns saying ONE word related to the secret word. Try to prove you know it without making it obvious for the Impostor.",
			icon: <MessageSquare className="w-8 h-8 text-indigo-500" strokeWidth={2.5} />,
			color: "border-indigo-200 bg-indigo-50",
		},
		{
			title: "3. Discussion",
			desc: "Debate who the Impostor is. The Impostor must pretend they know the word and blend in with the others.",
			icon: <Users className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />,
			color: "border-emerald-200 bg-emerald-50",
		},
		{
			title: "4. Voting",
			desc: "Vote out the person you think is the Impostor. If the Impostor gets voted out, players win. Otherwise, the Impostor wins!",
			icon: <CheckCircle2 className="w-8 h-8 text-yellow-500" strokeWidth={2.5} />,
			color: "border-yellow-200 bg-yellow-50",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="absolute inset-0 z-50 bg-indigo-600 overflow-y-auto p-6"
		>
			<div className="flex flex-col min-h-full">
				<div className="flex items-center justify-between mb-6 shrink-0">
					<button
						onClick={onClose}
						className="cursor-pointer w-12 h-12 bg-indigo-500 hover:bg-indigo-400 rounded-[16px] flex items-center justify-center text-white transition-colors border-2 border-indigo-400 shadow-inner"
					>
						<ArrowLeft className="w-6 h-6" strokeWidth={3} />
					</button>
					<h2 className="text-xl font-black text-white uppercase tracking-widest italic mt-1.5">
						How to Play
					</h2>
					<div className="w-12 h-12" /> {/* spacer for centering */}
				</div>

				<div className="space-y-4 flex-1 pb-8">
					{rules.map((rule, idx) => (
						<motion.div
							key={idx}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.1 }}
							className={cn(
								"p-5 rounded-[24px] border-4 shadow-lg text-indigo-900 flex items-center space-x-4",
								rule.color,
							)}
						>
							<div className="shrink-0">{rule.icon}</div>
							<div>
								<h3 className="font-black text-lg uppercase tracking-wider mb-1">{rule.title}</h3>
								<p className="font-bold text-sm text-indigo-900/80 leading-relaxed">{rule.desc}</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
