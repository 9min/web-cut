import { create } from "zustand";
import type { Track } from "@/types/timeline";
import { useTimelineStore } from "./useTimelineStore";

interface TimelineSnapshot {
	tracks: Track[];
	selectedClipId: string | null;
}

const MAX_HISTORY = 50;

interface HistoryState {
	past: TimelineSnapshot[];
	future: TimelineSnapshot[];
	pushSnapshot: () => void;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	reset: () => void;
}

function takeSnapshot(): TimelineSnapshot {
	const { tracks, selectedClipId } = useTimelineStore.getState();
	return {
		tracks: JSON.parse(JSON.stringify(tracks)),
		selectedClipId,
	};
}

function applySnapshot(snapshot: TimelineSnapshot): void {
	useTimelineStore.setState({
		tracks: snapshot.tracks,
		selectedClipId: snapshot.selectedClipId,
	});
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
	past: [],
	future: [],

	pushSnapshot: () => {
		const snapshot = takeSnapshot();
		set((state) => ({
			past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
			future: [],
		}));
	},

	undo: () => {
		const { past } = get();
		if (past.length === 0) return;

		const current = takeSnapshot();
		const previous = past[past.length - 1];
		if (!previous) return;

		applySnapshot(previous);
		set({
			past: past.slice(0, -1),
			future: [current, ...get().future],
		});
	},

	redo: () => {
		const { future } = get();
		if (future.length === 0) return;

		const current = takeSnapshot();
		const next = future[0];
		if (!next) return;

		applySnapshot(next);
		set({
			past: [...get().past, current],
			future: future.slice(1),
		});
	},

	canUndo: () => get().past.length > 0,
	canRedo: () => get().future.length > 0,

	reset: () => set({ past: [], future: [] }),
}));
