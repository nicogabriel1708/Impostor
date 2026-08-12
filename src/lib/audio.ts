class AudioEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private initialized = false;

	init() {
		if (this.initialized) return;
		try {
			this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.3; // volume
			this.masterGain.connect(this.ctx.destination);
			this.initialized = true;
		} catch (e) {
			console.error("Audio initialization failed", e);
		}
	}

	playClueAdded() {
		this.init();
		this.playTone(400, "sine", 0.05, 0.15);
		setTimeout(() => this.playTone(600, "sine", 0.05, 0.2), 100);
	}

	playVotingStart() {
		this.init();
		this.playTone(300, "triangle", 0.1, 0.3);
		setTimeout(() => this.playTone(400, "triangle", 0.1, 0.4), 200);
	}

	playReveal() {
		this.init();
		this.playTone(200, "sawtooth", 0.05, 0.5);
		setTimeout(() => this.playTone(300, "sawtooth", 0.05, 0.5), 150);
		setTimeout(() => this.playTone(400, "sawtooth", 0.05, 0.8), 300);
	}

	private playTone(freq: number, type: OscillatorType, attack: number, decay: number) {
		if (!this.ctx || !this.masterGain) return;

		// Resume context if suspended (browser policy)
		if (this.ctx.state === "suspended") {
			this.ctx.resume().catch(() => {});
		}

		try {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = type;
			osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

			gain.gain.setValueAtTime(0, this.ctx.currentTime);
			gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + attack);
			gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + decay);

			osc.connect(gain);
			gain.connect(this.masterGain);

			osc.start();
			osc.stop(this.ctx.currentTime + decay);
		} catch (e) {
			// Ignore audio errors
		}
	}
}

export const audio = new AudioEngine();

// Attempt to initialize on first interaction
if (typeof window !== "undefined") {
	const initAudio = () => {
		audio.init();
		document.removeEventListener("click", initAudio);
		document.removeEventListener("touchstart", initAudio);
	};
	document.addEventListener("click", initAudio);
	document.addEventListener("touchstart", initAudio);
}
