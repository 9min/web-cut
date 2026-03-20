import { create } from "zustand";
import type { Clip, Track } from "@/types/timeline";

interface TimelineState {
	tracks: Track[];
	selectedClipId: string | null;
	addTrack: (track: Track) => void;
	removeTrack: (id: string) => void;
	addClip: (trackId: string, clip: Clip) => void;
	removeClip: (trackId: string, clipId: string) => void;
	moveClip: (fromTrackId: string, clipId: string, toTrackId: string, newStartTime: number) => void;
	selectClip: (clipId: string | null) => void;
	reset: () => void;
}

const initialState = {
	tracks: [] as Track[],
	selectedClipId: null as string | null,
};

export const useTimelineStore = create<TimelineState>((set, get) => ({
	...initialState,

	addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),

	removeTrack: (id) => set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id) })),

	addClip: (trackId, clip) =>
		set((state) => ({
			tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t)),
		})),

	removeClip: (trackId, clipId) => {
		const { selectedClipId } = get();
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t,
			),
			selectedClipId: selectedClipId === clipId ? null : selectedClipId,
		}));
	},

	moveClip: (fromTrackId, clipId, toTrackId, newStartTime) => {
		const clip = get()
			.tracks.find((t) => t.id === fromTrackId)
			?.clips.find((c) => c.id === clipId);
		if (!clip) return;

		if (fromTrackId === toTrackId) {
			set((state) => ({
				tracks: state.tracks.map((t) =>
					t.id === fromTrackId
						? {
								...t,
								clips: t.clips.map((c) =>
									c.id === clipId ? { ...c, startTime: newStartTime } : c,
								),
							}
						: t,
				),
			}));
		} else {
			const movedClip = { ...clip, trackId: toTrackId, startTime: newStartTime };
			set((state) => ({
				tracks: state.tracks.map((t) => {
					if (t.id === fromTrackId) {
						return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
					}
					if (t.id === toTrackId) {
						return { ...t, clips: [...t.clips, movedClip] };
					}
					return t;
				}),
			}));
		}
	},

	selectClip: (clipId) => set({ selectedClipId: clipId }),

	reset: () => set(initialState),
}));
