import { GameProvider, useGame } from "./store";
import { CluePhaseView } from "./views/CluePhaseView";
import { DiscussionView } from "./views/DiscussionView";
import { HomeView } from "./views/HomeView";
import { LobbyView } from "./views/LobbyView";
import { PlayerSetupView } from "./views/PlayerSetupView";
import { RevealView } from "./views/RevealView";
import { RoleRevealView } from "./views/RoleRevealView";
import { VotingView } from "./views/VotingView";

function GameRouter() {
	const { roomState, sessionId, roomCode } = useGame();

	if (!roomCode || !sessionId) {
		return <HomeView />;
	}

	// Check if player has set up their name/avatar
	const me = roomState?.players.find((p) => p.id === sessionId);
	if (!me || !me.name || !me.avatar) {
		return <PlayerSetupView />;
	}

	switch (roomState?.phase) {
		case "Lobby":
			return <LobbyView />;
		case "RoleReveal":
			return <RoleRevealView />;
		case "CluePhase":
			return <CluePhaseView />;
		case "Discussion":
			return <DiscussionView />;
		case "Voting":
			return <VotingView />;
		case "Reveal":
			return <RevealView />;
		default:
			return <div>Unknown Phase</div>;
	}
}

export default function App() {
	return (
		<GameProvider>
			<div className="h-[100dvh] max-h-[100dvh] bg-indigo-900 text-white font-sans selection:bg-yellow-400/30 overflow-hidden flex justify-center items-center p-0 md:p-6">
				<main className="w-full max-w-2xl h-full flex flex-col relative overflow-hidden bg-indigo-600 shadow-2xl md:rounded-[40px] md:border-[8px] border-indigo-800">
					<GameRouter />
				</main>
			</div>
		</GameProvider>
	);
}
