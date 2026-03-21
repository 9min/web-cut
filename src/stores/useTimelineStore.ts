import { create } from "zustand";
import { DEFAULT_CLIP_FILTER } from "@/constants/filter";
import { TEXT_MAX_LENGTH } from "@/constants/textOverlay";
import type { ClipFilter } from "@/types/filter";
import type { TextClip, TextOverlay } from "@/types/textOverlay";
import type { Clip, ClipTransform, Track } from "@/types/timeline";
import type { Transition } from "@/types/transition";
import { splitClipAt, trimClip } from "@/utils/editUtils";
import { isDefaultFilter } from "@/utils/filterUtils";
import { generateId } from "@/utils/generateId";
import { sanitizeTextInput } from "@/utils/textSanitizer";
import { findDropIndex, reorderAndCompact } from "@/utils/timelineUtils";

interface TimelineState {
	tracks: Track[];
	selectedClipId: string | null;
	addTrack: (track: Track) => void;
	removeTrack: (id: string) => void;
	addClip: (trackId: string, clip: Clip) => void;
	removeClip: (trackId: string, clipId: string) => void;
	moveClip: (fromTrackId: string, clipId: string, toTrackId: string, newStartTime: number) => void;
	insertClipAt: (
		fromTrackId: string,
		clipId: string,
		toTrackId: string,
		newStartTime: number,
	) => void;
	splitClip: (trackId: string, clipId: string, splitTime: number) => void;
	trimClipAction: (
		trackId: string,
		clipId: string,
		newStartTime: number,
		newEndTime: number,
	) => void;
	removeClipsByAssetId: (assetId: string) => void;
	selectClip: (clipId: string | null) => void;
	addTransition: (trackId: string, clipId: string, transition: Transition) => void;
	removeTransition: (trackId: string, clipId: string) => void;
	updateTransition: (trackId: string, clipId: string, updates: Partial<Transition>) => void;
	updateFilter: (trackId: string, clipId: string, updates: Partial<ClipFilter>) => void;
	resetFilter: (trackId: string, clipId: string) => void;
	addAudioTrack: () => void;
	updateClipVolume: (trackId: string, clipId: string, volume: number) => void;
	updateTransform: (trackId: string, clipId: string, updates: Partial<ClipTransform>) => void;
	resetTransform: (trackId: string, clipId: string) => void;
	toggleTrackMuted: (trackId: string) => void;
	toggleTrackLocked: (trackId: string) => void;
	addTextTrack: () => void;
	addTextClip: (trackId: string, textClip: TextClip) => void;
	updateTextClip: (
		trackId: string,
		textClipId: string,
		updates: Partial<Pick<TextClip, "startTime" | "duration" | "name">>,
	) => void;
	updateTextClipOverlay: (
		trackId: string,
		textClipId: string,
		updates: Partial<TextOverlay>,
	) => void;
	removeTextClip: (trackId: string, textClipId: string) => void;
	moveTextClip: (
		fromTrackId: string,
		textClipId: string,
		toTrackId: string,
		newStartTime: number,
	) => void;
	reset: () => void;
}

/** 삽입 구간과 겹치는 클립들을 연쇄적으로 뒤로 밀어낸다 */
function pushClipsRight(clips: Clip[], insertStart: number, insertEnd: number): Clip[] {
	const sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
	const result: Clip[] = [];
	let currentEnd = insertEnd;

	for (const clip of sorted) {
		const clipEnd = clip.startTime + clip.duration;
		if (clip.startTime < currentEnd && clipEnd > insertStart) {
			// 겹침 → 뒤로 밀어냄
			const pushed = { ...clip, startTime: currentEnd };
			currentEnd = pushed.startTime + pushed.duration;
			result.push(pushed);
		} else if (clip.startTime >= currentEnd) {
			// 겹치지 않음 → 그대로
			result.push(clip);
		} else {
			// insertStart 이전에 끝나는 클립 → 그대로
			result.push(clip);
		}
	}

	return result;
}

const DEFAULT_TRACK: Track = {
	id: "default-video-track",
	name: "타임라인 1",
	type: "video",
	clips: [],
	textClips: [],
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
		const track = get().tracks.find((t) => t.id === trackId);
		if (!track) return;

		// 삭제되는 클립의 이전 클립 outTransition도 제거 (다음 클립이 바뀌므로)
		const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
		const clipIndex = sorted.findIndex((c) => c.id === clipId);
		const prevClipId = clipIndex > 0 ? sorted[clipIndex - 1]?.id : undefined;

		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips
								.filter((c) => c.id !== clipId)
								.map((c) => (c.id === prevClipId ? { ...c, outTransition: undefined } : c)),
						}
					: t,
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

	insertClipAt: (fromTrackId, clipId, toTrackId, newStartTime) => {
		const clip = get()
			.tracks.find((t) => t.id === fromTrackId)
			?.clips.find((c) => c.id === clipId);
		if (!clip) return;

		const movedClip = { ...clip, trackId: toTrackId, startTime: newStartTime };
		const insertEnd = newStartTime + clip.duration;

		set((state) => ({
			tracks: state.tracks.map((t) => {
				if (t.id === fromTrackId && fromTrackId === toTrackId) {
					// 같은 트랙: 인덱스 기반 리오더
					const otherClips = t.clips
						.filter((c) => c.id !== clipId)
						.sort((a, b) => a.startTime - b.startTime);
					const dropIndex = findDropIndex(otherClips, newStartTime);
					const reordered = reorderAndCompact(otherClips, movedClip, dropIndex);
					return { ...t, clips: reordered };
				}
				if (t.id === fromTrackId) {
					// 원래 트랙에서 제거
					return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
				}
				if (t.id === toTrackId) {
					// 대상 트랙: 밀어내기 → 삽입
					const pushed = pushClipsRight(t.clips, newStartTime, insertEnd);
					return { ...t, clips: [...pushed, movedClip] };
				}
				return t;
			}),
		}));
	},

	splitClip: (trackId, clipId, splitTime) => {
		const track = get().tracks.find((t) => t.id === trackId);
		const clip = track?.clips.find((c) => c.id === clipId);
		if (!clip) return;

		const result = splitClipAt(clip, splitTime, generateId(), generateId());
		if (!result) return;

		const [left, right] = result;
		// 원본의 outTransition을 오른쪽 분할 클립에 이전, 필터는 양쪽에 복사
		const leftClip: Clip = {
			...left,
			outTransition: undefined,
			filter: clip.filter,
		};
		const rightClip: Clip = {
			...right,
			outTransition: clip.outTransition,
			filter: clip.filter,
		};
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? { ...t, clips: [...t.clips.filter((c) => c.id !== clipId), leftClip, rightClip] }
					: t,
			),
			selectedClipId: leftClip.id,
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

	addTransition: (trackId, clipId, transition) => {
		const track = get().tracks.find((t) => t.id === trackId);
		if (!track) return;

		const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
		const clipIndex = sorted.findIndex((c) => c.id === clipId);
		const nextClip = clipIndex >= 0 ? sorted[clipIndex + 1] : undefined;
		if (!nextClip) return;

		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) =>
								c.id === clipId ? { ...c, outTransition: transition } : c,
							),
						}
					: t,
			),
		}));
	},

	removeTransition: (trackId, clipId) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) => (c.id === clipId ? { ...c, outTransition: undefined } : c)),
						}
					: t,
			),
		}));
	},

	updateTransition: (trackId, clipId, updates) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) =>
								c.id === clipId && c.outTransition
									? { ...c, outTransition: { ...c.outTransition, ...updates } }
									: c,
							),
						}
					: t,
			),
		}));
	},

	updateFilter: (trackId, clipId, updates) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) => {
								if (c.id !== clipId) return c;
								const merged = { ...(c.filter ?? DEFAULT_CLIP_FILTER), ...updates };
								return { ...c, filter: isDefaultFilter(merged) ? undefined : merged };
							}),
						}
					: t,
			),
		}));
	},

	resetFilter: (trackId, clipId) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) => (c.id === clipId ? { ...c, filter: undefined } : c)),
						}
					: t,
			),
		}));
	},

	addAudioTrack: () => {
		const { tracks } = get();
		const audioTrackCount = tracks.filter((t) => t.type === "audio").length;
		const name = `오디오 ${audioTrackCount + 1}`;
		set((state) => ({
			tracks: [
				...state.tracks,
				{
					id: generateId(),
					name,
					type: "audio" as const,
					clips: [],
					textClips: [],
					muted: false,
					locked: false,
					order: state.tracks.length,
				},
			],
		}));
	},

	updateClipVolume: (trackId, clipId, volume) => {
		const clamped = Math.max(0, Math.min(1, volume));
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) =>
								c.id === clipId ? { ...c, volume: clamped === 1 ? undefined : clamped } : c,
							),
						}
					: t,
			),
		}));
	},

	updateTransform: (trackId, clipId, updates) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) => {
								if (c.id !== clipId) return c;
								const current = c.transform ?? {
									x: 50,
									y: 50,
									scaleX: 1,
									scaleY: 1,
									rotation: 0,
								};
								return { ...c, transform: { ...current, ...updates } };
							}),
						}
					: t,
			),
		}));
	},

	resetTransform: (trackId, clipId) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							clips: t.clips.map((c) => (c.id === clipId ? { ...c, transform: undefined } : c)),
						}
					: t,
			),
		}));
	},

	toggleTrackMuted: (trackId) =>
		set((state) => ({
			tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
		})),

	toggleTrackLocked: (trackId) =>
		set((state) => ({
			tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
		})),

	addTextTrack: () => {
		const { tracks } = get();
		const textTrackCount = tracks.filter((t) => t.type === "text").length;
		const name = `텍스트 ${textTrackCount + 1}`;
		set((state) => ({
			tracks: [
				...state.tracks,
				{
					id: generateId(),
					name,
					type: "text",
					clips: [],
					textClips: [],
					muted: false,
					locked: false,
					order: state.tracks.length,
				},
			],
		}));
	},

	addTextClip: (trackId, textClip) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId ? { ...t, textClips: [...t.textClips, textClip] } : t,
			),
		}));
	},

	updateTextClip: (trackId, textClipId, updates) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							textClips: t.textClips.map((tc) =>
								tc.id === textClipId ? { ...tc, ...updates } : tc,
							),
						}
					: t,
			),
		}));
	},

	updateTextClipOverlay: (trackId, textClipId, updates) => {
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							textClips: t.textClips.map((tc) => {
								if (tc.id !== textClipId) return tc;
								const sanitizedUpdates =
									updates.content !== undefined
										? { ...updates, content: sanitizeTextInput(updates.content, TEXT_MAX_LENGTH) }
										: updates;
								return { ...tc, overlay: { ...tc.overlay, ...sanitizedUpdates } };
							}),
						}
					: t,
			),
		}));
	},

	removeTextClip: (trackId, textClipId) => {
		const { selectedClipId } = get();
		set((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? { ...t, textClips: t.textClips.filter((tc) => tc.id !== textClipId) }
					: t,
			),
			selectedClipId: selectedClipId === textClipId ? null : selectedClipId,
		}));
	},

	moveTextClip: (fromTrackId, textClipId, toTrackId, newStartTime) => {
		const fromTrack = get().tracks.find((t) => t.id === fromTrackId);
		const textClip = fromTrack?.textClips.find((tc) => tc.id === textClipId);
		if (!textClip) return;

		if (fromTrackId === toTrackId) {
			set((state) => ({
				tracks: state.tracks.map((t) =>
					t.id === fromTrackId
						? {
								...t,
								textClips: t.textClips.map((tc) =>
									tc.id === textClipId ? { ...tc, startTime: newStartTime } : tc,
								),
							}
						: t,
				),
			}));
		} else {
			const movedClip = { ...textClip, trackId: toTrackId, startTime: newStartTime };
			set((state) => ({
				tracks: state.tracks.map((t) => {
					if (t.id === fromTrackId) {
						return { ...t, textClips: t.textClips.filter((tc) => tc.id !== textClipId) };
					}
					if (t.id === toTrackId) {
						return { ...t, textClips: [...t.textClips, movedClip] };
					}
					return t;
				}),
			}));
		}
	},

	reset: () => set(initialState),
}));
