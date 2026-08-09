import { v4 as uuidv4 } from 'uuid';
import { GamePhase, GamePlayer, GameSettings, RoomState, RevealResult, ClueInfo, ClientRoomState, HintMode, Player, VoteResult } from '../src/types';
import { CATEGORIES } from '../src/words';
import { Server, Socket } from 'socket.io';

const ROOM_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour inactivity
const DISCONNECT_GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes

export class Room {
  code: string;
  phase: GamePhase = 'Lobby';
  players: Map<string, GamePlayer> = new Map();
  settings: GameSettings = {
    impostorCount: 1,
    category: 'All',
    clueTimeLimit: 30,
    discussionTimeLimit: 60,
    hintMode: 'none',
    roundMode: 'short',
  };
  
  timerEndsAt: number | null = null;
  currentTurnPlayerId: string | null = null;
  clues: ClueInfo[] = [];
  
  secretWord: string = '';
  secretVagueHint: string = '';
  secretCategory: string = '';
  
  revealResult: RevealResult | null = null;
  
  turnQueue: string[] = [];
  
  lastActivityAt: number = Date.now();
  timerTimeout: NodeJS.Timeout | null = null;
  
  io: Server;

  constructor(code: string, io: Server) {
    this.code = code;
    this.io = io;
  }

  touch() {
    this.lastActivityAt = Date.now();
  }

  get state(): RoomState {
    return {
      code: this.code,
      phase: this.phase,
      players: Array.from(this.players.values()),
      settings: this.settings,
      timerEndsAt: this.timerEndsAt,
      currentTurnPlayerId: this.currentTurnPlayerId,
      clues: this.clues,
      roundCount: this.roundCount,
      revealResult: this.revealResult,
    };
  }

  getClientState(playerId: string): ClientRoomState {
    const player = this.players.get(playerId);
    const hasVoted = player ? player.vote !== null : false;
    return {
      ...this.state,
      players: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isHost: p.isHost,
        connected: p.connected,
        isSpectator: p.isSpectator,
      })),
      myRole: player?.role,
      myWord: player?.word,
      myHint: player?.hint,
      secretCategory: this.secretCategory,
      myVote: player?.vote,
      hasVoted,
    };
  }

  broadcastState() {
    for (const [playerId, player] of this.players.entries()) {
      // If we stored socketIds, we could emit directly.
      // Easiest is to send to the room, but we need custom state per player.
      // Wait, we can emit to specific sockets. Let's just emit to everyone in the room individually.
    }
  }

  setPhase(phase: GamePhase, durationSec?: number) {
    this.phase = phase;
    
    if (phase === 'Lobby') {
      for (const p of this.players.values()) {
        if (p.connected) p.isSpectator = false;
      }
    }

    if (this.timerTimeout) clearTimeout(this.timerTimeout);
    
    if (durationSec) {
      this.timerEndsAt = Date.now() + durationSec * 1000;
      this.timerTimeout = setTimeout(() => this.handleTimerExpiry(), durationSec * 1000);
    } else {
      this.timerEndsAt = null;
      this.timerTimeout = null;
    }
  }

  handleTimerExpiry() {
    if (this.phase === 'RoleReveal') {
      this.startCluePhase();
    } else if (this.phase === 'CluePhase') {
      this.nextTurn(); // auto-skip player or advance to discussion
    } else if (this.phase === 'Reveal') {
      if (this.revealResult && this.revealResult.gameContinues) {
        this.nextRound();
      }
    } else if (this.phase === 'Discussion') {
      this.startVotingPhase();
    } else if (this.phase === 'Voting') {
      this.tallyVotes();
    }
  }

  addPlayer(id: string, name: string, avatar: string, color: string) {
    this.touch();
    const isHost = this.players.size === 0;
    this.players.set(id, {
      id,
      name,
      avatar,
      color,
      isHost,
      connected: true,
      isSpectator: this.phase !== 'Lobby',
      role: 'player',
      word: null,
      hint: null,
      clue: null,
      vote: null,
    });
  }

  checkHostTransfer() {
    const playersArr = Array.from(this.players.values());
    if (playersArr.length === 0) return;
    
    // If there is no connected host, find the first connected player to be host
    const connectedHost = playersArr.find(p => p.isHost && p.connected);
    if (!connectedHost) {
      playersArr.forEach(p => p.isHost = false); // remove host from offline players
      const nextHost = playersArr.find(p => p.connected);
      if (nextHost) {
        nextHost.isHost = true;
        this.io.to(this.code.toUpperCase()).emit('chat_message', {
          id: Math.random().toString(36).substring(7),
          playerId: 'system',
          text: `${nextHost.name} is now the room host.`,
          timestamp: Date.now()
        });
      } else {
        // If no one is connected, just let the first one be host
        playersArr[0].isHost = true;
      }
    }
  }

  removePlayer(id: string) {
    this.players.delete(id);
    this.checkHostTransfer();
  }

  startGame() {
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    if (activePlayers.length < 3) return;
    this.touch();
    
    this.io.to(this.code.toUpperCase()).emit('clear_chat');
    
    this.baseQueue = activePlayers.map(p => p.id);
    for (let i = this.baseQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.baseQueue[i], this.baseQueue[j]] = [this.baseQueue[j], this.baseQueue[i]];
    }
    this.roundCount = 0;
    
    // Reset player states
    for (const player of this.players.values()) {
      player.clue = null;
      player.vote = null;
    }
    this.clues = [];
    this.revealResult = null;
    
    // Pick word
    let words: any[] = [];
    let pickedCategory = this.settings.category;
    if (this.settings.category === 'All') {
      const cats = Object.keys(CATEGORIES);
      pickedCategory = cats[Math.floor(Math.random() * cats.length)];
      words = CATEGORIES[pickedCategory];
    } else {
      words = CATEGORIES[this.settings.category];
    }
    
    if (!words || words.length === 0) return;
    const wordEntry = words[Math.floor(Math.random() * words.length)];
    this.secretWord = wordEntry.word;
    this.secretVagueHint = wordEntry.vagueHint;
    this.secretCategory = pickedCategory;
    
    // Assign roles
    const playerIds = activePlayers.map(p => p.id);
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    
    let impostorCount = Math.min(this.settings.impostorCount, Math.floor(playerIds.length / 2) || 1);
    
    for (let i = 0; i < playerIds.length; i++) {
      const p = this.players.get(playerIds[i])!;
      if (i < impostorCount) {
        p.role = 'impostor';
        p.word = null;
        if (this.settings.hintMode === 'category') {
          p.hint = `Category: ${this.settings.category}`;
        } else if (this.settings.hintMode === 'vague') {
          p.hint = `Hint: ${this.secretVagueHint}`;
        } else {
          p.hint = null;
        }
      } else {
        p.role = 'player';
        p.word = this.secretWord;
        p.hint = null;
      }
    }

    // Explicitly reset spectators roles just in case
    for (const p of this.players.values()) {
      if (p.isSpectator) {
        p.role = 'player';
        p.word = null;
        p.hint = null;
      }
    }
    
    this.setPhase('RoleReveal', 8);
  }

  startCluePhase() {
    this.touch();
    // Build turn queue
    let currentQueue = this.baseQueue.filter(id => {
      const p = this.players.get(id);
      return p && !p.isSpectator;
    });
    
    if (currentQueue.length > 0) {
      const shift = this.roundCount % currentQueue.length;
      currentQueue = [...currentQueue.slice(shift), ...currentQueue.slice(0, shift)];
    }
    this.turnQueue = currentQueue;
    this.roundCount++;
    this.nextTurn(true);
  }

  nextTurn(first = false) {
    if (!first) {
      // Mark current player as skipped if they didn't submit
      if (this.currentTurnPlayerId) {
        const p = this.players.get(this.currentTurnPlayerId);
        if (p && !p.clue) {
          p.clue = '- Skipped -';
          this.clues.push({ playerId: p.id, clue: p.clue, round: this.roundCount });
        }
      }
    }
    
    if (this.turnQueue.length === 0) {
      if (this.currentTurnPlayerId !== null) {
        this.currentTurnPlayerId = null;
        this.setPhase('CluePhase', 4); // Wait 4 seconds before discussion
        return;
      }
      this.startDiscussionPhase();
      return;
    }
    
    this.currentTurnPlayerId = this.turnQueue.shift()!;
    this.setPhase('CluePhase', this.settings.clueTimeLimit);
  }

  submitClue(playerId: string, clue: string) {
    if (this.phase !== 'CluePhase' || this.currentTurnPlayerId !== playerId) return;
    this.touch();
    
    const p = this.players.get(playerId);
    if (p) {
      p.clue = clue.trim().substring(0, 30);
      this.clues.push({ playerId: p.id, clue: p.clue, round: this.roundCount });
    }
    this.nextTurn();
  }

  startDiscussionPhase() {
    this.setPhase('Discussion', this.settings.discussionTimeLimit);
  }

  startVotingPhase() {
    this.setPhase('Voting', 30); // 30 sec to vote
  }

  submitVote(playerId: string, votedForId: string | null) {
    if (this.phase !== 'Voting') return;
    this.touch();
    
    const p = this.players.get(playerId);
    if (p && !p.isSpectator) {
      p.vote = votedForId || 'skip';
    }
    
    // Check if everyone voted
    const activePlayers = Array.from(this.players.values()).filter(player => !player.isSpectator);
    if (activePlayers.every(player => player.vote !== null)) {
      this.tallyVotes();
    }
  }

  tallyVotes() {
    if (this.phase === 'Reveal') return; // prevent double tally

    // Force skip for players who didn't vote
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    for (const p of activePlayers) {
      if (p.vote === null) {
        p.vote = 'skip';
      }
    }
    
    const voteCounts: Record<string, string[]> = {};
    for (const p of this.players.values()) {
      if (p.vote && p.vote !== 'skip') {
        if (!voteCounts[p.vote]) voteCounts[p.vote] = [];
        voteCounts[p.vote].push(p.id);
      }
    }
    
    let maxVotes = 0;
    let eliminatedIds: string[] = [];
    
    for (const [targetId, voters] of Object.entries(voteCounts)) {
      if (voters.length > maxVotes) {
        maxVotes = voters.length;
        eliminatedIds = [targetId];
      } else if (voters.length === maxVotes) {
        eliminatedIds.push(targetId);
      }
    }

    if (eliminatedIds.length > 1) {
      eliminatedIds = []; // tie = draw
    }
    
    // Convert voteCounts to VoteResult array
    const votes: VoteResult[] = Object.entries(voteCounts).map(([targetId, voters]) => ({
      playerId: targetId,
      voterIds: voters,
    }));
    
    // Add skips
    const skippers = Array.from(this.players.values()).filter(p => p.vote === 'skip').map(p => p.id);
    if (skippers.length > 0) {
      votes.push({ playerId: 'skip', voterIds: skippers });
    }
    
    const impostors = Array.from(this.players.values()).filter(p => p.role === 'impostor').map(p => p.id);
    
    let winners: RevealResult['winners'] = 'tie';
    let gameContinues = false;

    if (this.settings.roundMode === 'long') {
      for (const id of eliminatedIds) {
        const p = this.players.get(id);
        if (p) p.isSpectator = true;
      }

      const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
      const activeImpostors = activePlayers.filter(p => p.role === 'impostor');
      const activeCivilians = activePlayers.filter(p => p.role === 'player');

      if (activeImpostors.length === 0) {
        winners = 'players';
      } else if (activeImpostors.length >= activeCivilians.length) {
        winners = 'impostors';
      } else {
        gameContinues = true;
      }
    } else {
      if (eliminatedIds.length === 1) {
        const eliminated = this.players.get(eliminatedIds[0]);
        if (eliminated) {
          if (eliminated.role === 'impostor') {
            winners = 'players';
          } else {
            winners = 'impostors';
          }
        }
      } else {
        gameContinues = true; // Tie means game continues
      }
    }

    this.revealResult = {
      eliminatedPlayerIds: eliminatedIds,
      winners,
      impostors: gameContinues ? [] : impostors, // hide if continues
      word: gameContinues ? '' : this.secretWord, // hide if continues
      category: this.secretCategory || this.settings.category,
      votes,
      gameContinues,
    };
    
    this.setPhase('Reveal', gameContinues ? 10 : undefined);
  }

  nextRound() {
    if (this.phase !== 'Reveal') return;

    this.io.to(this.code.toUpperCase()).emit('clear_chat');

    if (this.revealResult && this.revealResult.gameContinues) {
      for (const player of this.players.values()) {
        player.clue = null;
        player.vote = null;
      }
      this.startCluePhase();
    } else {
      for (const player of this.players.values()) {
        player.clue = null;
        player.vote = null;
        player.role = 'player';
        player.word = null;
        player.hint = null;
        player.isSpectator = false;
      }
      this.clues = [];
      this.revealResult = null;
      this.setPhase('Lobby');
    }
  }
}
