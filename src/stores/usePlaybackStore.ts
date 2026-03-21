import { create } from "zustand";

interface PlaybackState {
	currentTime: number;
	isPlaying: boolean;
	duration: number;
	speed: number;
	loopEnabled: boolean;
	loopIn: number;
	loopOut: number;
	play: () => void;
	pause: () => void;
	togglePlayback: () => void;
	seek: (time: number) => void;
	setDuration: (duration: number) => void;
	setSpeed: (speed: number) => void;
	toggleLoop: () => void;
	setLoopRange: (loopIn: number, loopOut: number) => void;
	reset: () => void;
}

const initialState = {
	currentTime: 0,
	isPlaying: false,
	duration: 0,
	speed: 1,
	loopEnabled: false,
	loopIn: 0,
	loopOut: 0,
};

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
	...initialState,

	play: () => set({ isPlaying: true }),
	pause: () => set({ isPlaying: false }),
	togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

	seek: (time) => {
		const { duration } = get();
		const maxTime = duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
		set({ currentTime: Math.max(0, Math.min(time, maxTime)) });
	},

	setDuration: (duration) => set({ duration }),

	setSpeed: (speed) => {
		const clamped = Math.max(0.25, Math.min(4, speed));
		set({ speed: clamped });
	},

	toggleLoop: () => set((state) => ({ loopEnabled: !state.loopEnabled })),

	setLoopRange: (loopIn, loopOut) => set({ loopIn, loopOut }),

	reset: () => set(initialState),
}));
