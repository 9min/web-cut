import { create } from "zustand";
import type { Track } from "@/types/timeline";
import { useTimelineStore } from "./useTimelineStore";

interface LabeledSnapshot {
	tracks: Track[];
	selectedClipIds: string[];
	label: string;
	timestamp: number;
}

const MAX_HISTORY = 100;

interface HistoryState {
	past: LabeledSnapshot[];
	future: LabeledSnapshot[];
	pushSnapshot: (label: string) => void;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	getUndoLabel: () => string | null;
	getRedoLabel: () => string | null;
	reset: () => void;
}

function takeSnapshot(label: string): LabeledSnapshot {
	const { tracks, selectedClipIds } = useTimelineStore.getState();
	return {
		tracks: structuredClone(tracks),
		selectedClipIds: [...selectedClipIds],
		label,
		timestamp: Date.now(),
	};
}

function applySnapshot(snapshot: LabeledSnapshot): void {
	useTimelineStore.setState({
		tracks: snapshot.tracks,
		selectedClipIds: new Set(snapshot.selectedClipIds),
	});
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
	past: [],
	future: [],

	pushSnapshot: (label: string) => {
		const snapshot = takeSnapshot(label);
		set((state) => ({
			past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
			future: [],
		}));
	},

	undo: () => {
		const { past } = get();
		if (past.length === 0) return;

		const current = takeSnapshot("현재 상태");
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

		const current = takeSnapshot("현재 상태");
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

	getUndoLabel: () => {
		const { past } = get();
		if (past.length === 0) return null;
		return past[past.length - 1]?.label ?? null;
	},

	getRedoLabel: () => {
		const { future } = get();
		if (future.length === 0) return null;
		return future[0]?.label ?? null;
	},

	reset: () => set({ past: [], future: [] }),
}));
