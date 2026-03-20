import { create } from "zustand";
import type { Clip, Track } from "@/types/timeline";
import { splitClipAt, trimClip } from "@/utils/editUtils";
import { generateId } from "@/utils/generateId";

interface TimelineState {
	tracks: Track[];
	selectedClipId: string | null;
	addTrack: (track: Track) => void;
	removeTrack: (id: string) => void;
	addClip: (trackId: string, clip: Clip) => void;
	removeClip: (trackId: string, clipId: string) => void;
	moveClip: (fromTrackId: string, clipId: string, toTrackId: string, newStartTime: number) => void;
	splitClip: (trackId: string, clipId: string, splitTime: number) => void;
	trimClipAction: (
		trackId: string,
		clipId: string,
		newStartTime: number,
		newEndTime: number,
	) => void;
	removeClipsByAssetId: (assetId: string) => void;
	selectClip: (clipId: string | null) => void;
	reset: () => void;
}

const DEFAULT_TRACK: Track = {
	id: "default-video-track",
	name: "비디오 1",
	type: "video",
	clips: [],
	muted: false,
	locked: false,
	order: 0,
};

const initialState = {
	tracks: [DEFAULT_TRACK] as Track[],
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

	splitClip: (trackId, clipId, splitTime) => {
		const track = get().tracks.find((t) => t.id === trackId);
		const clip = track?.clips.find((c) => c.id === clipId);
		if (!clip) return;

		const result = splitClipAt(clip, splitTime, generateId(), generateId());
		if (!result) return;

		const [left, right] = result;
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? { ...t, clips: [...t.clips.filter((c) => c.id !== clipId), left, right] }
					: t,
			),
			selectedClipId: left.id,
		}));
	},

	trimClipAction: (trackId, clipId, newStartTime, newEndTime) => {
		const track = get().tracks.find((t) => t.id === trackId);
		const clip = track?.clips.find((c) => c.id === clipId);
		if (!clip) return;

		const trimmed = trimClip(clip, newStartTime, newEndTime);
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? trimmed : c)) } : t,
			),
		}));
	},

	removeClipsByAssetId: (assetId) => {
		const { selectedClipId } = get();
		let shouldClearSelection = false;

		const newTracks = get().tracks.map((t) => {
			const filtered = t.clips.filter((c) => {
				if (c.assetId === assetId) {
					if (c.id === selectedClipId) shouldClearSelection = true;
					return false;
				}
				return true;
			});
			return filtered.length === t.clips.length ? t : { ...t, clips: filtered };
		});

		set({
			tracks: newTracks,
			selectedClipId: shouldClearSelection ? null : selectedClipId,
		});
	},

	selectClip: (clipId) => set({ selectedClipId: clipId }),

	reset: () => set(initialState),
}));
