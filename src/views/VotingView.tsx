import React, { useState } from 'react';
import { useGame } from '../store';
import { Timer } from '../components/Timer';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function VotingView() {
  const { roomState, sessionId, submitVote } = useGame();
  
  if (!roomState) return null;

  const hasVoted = roomState.hasVoted;
  const myVote = roomState.myVote;

  const handleVote = (targetId: string | null) => {
    if (!hasVoted) {
      submitVote(targetId);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 h-full relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-700/50 p-4 rounded-3xl border-2 border-indigo-500/30">
        <div>
          <h2 className="text-sm font-black tracking-widest text-indigo-200 uppercase">Voting Phase</h2>
          <p className="text-xl font-black text-white mt-1 uppercase italic tracking-tighter">Who is the Impostor?</p>
        </div>
        <Timer endsAt={roomState.timerEndsAt} />
      </div>

      {hasVoted ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-yellow-400 text-indigo-900 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-yellow-200"
          >
            <CheckCircle2 className="w-12 h-12" strokeWidth={3} />
          </motion.div>
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">Vote Submitted</h3>
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-sm">Waiting for others...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-8 space-y-3">
          {roomState.players.map(p => {
            if (p.id === sessionId) return null; // Can't vote for self
            
            // Find their clue
            const theirClue = roomState.clues.find(c => c.playerId === p.id)?.clue || 'No clue given';
            
            return (
              <button
                key={p.id}
                onClick={() => handleVote(p.id)}
                className="w-full bg-white hover:bg-indigo-50 border-b-4 border-indigo-200 p-4 rounded-[20px] flex items-center space-x-4 transition-transform active:translate-y-1 active:border-b-0 text-left group shadow-md"
              >
                <div className="w-14 h-14 rounded-[16px] bg-indigo-100/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-xl text-indigo-900 truncate uppercase tracking-wider">{p.name}</div>
                  <div className="text-sm text-indigo-400 font-bold italic truncate">"{theirClue}"</div>
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
      )}
    </div>
  );
}
