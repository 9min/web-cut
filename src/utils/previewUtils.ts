import type { TextClip } from "@/types/textOverlay";
import type { Clip, Track } from "@/types/timeline";
import type { TransitionType } from "@/types/transition";
import { getTransitionOverlapRange, getTransitionProgress } from "./transitionUtils";

export interface VisibleClip {
	clip: Clip;
	trackId: string;
	localTime: number;
	muted?: boolean;
	transitionProgress?: number;
	transitionType?: TransitionType;
	isOutgoing?: boolean;
}

export function getVisibleClipsAtTime(tracks: Track[], currentTime: number): VisibleClip[] {
	const result: VisibleClip[] = [];

	for (const track of tracks) {
		if (track.type !== "video") continue;

		const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);

		for (let i = 0; i < sorted.length; i++) {
			const clip = sorted[i] as Clip;
			const clipEnd = clip.startTime + clip.duration;

			// 트랜지션 overlap 구간 확인
			const overlapRange = getTransitionOverlapRange(clip);
			if (overlapRange && currentTime >= overlapRange.start && currentTime < overlapRange.end) {
				const nextClip = sorted[i + 1];
				if (nextClip) {
					const progress = getTransitionProgress(
						currentTime,
						overlapRange.start,
						clip.outTransition?.duration ?? 0,
					);
					const outElapsed = currentTime - clip.startTime;
					result.push({
						clip,
						trackId: track.id,
						localTime: clip.inPoint + outElapsed,
						muted: track.muted || undefined,
						transitionProgress: progress,
						transitionType: clip.outTransition?.type,
						isOutgoing: true,
					});

					const inElapsed = currentTime - nextClip.startTime;
					result.push({
						clip: nextClip,
						trackId: track.id,
						localTime: nextClip.inPoint + Math.max(0, inElapsed),
						muted: track.muted || undefined,
						transitionProgress: progress,
						transitionType: clip.outTransition?.type,
						isOutgoing: false,
					});
					continue;
				}
			}

			// 이전 클립의 트랜지션으로 이미 추가되었는지 확인
			const prevClip = i > 0 ? sorted[i - 1] : undefined;
			if (prevClip) {
				const prevOverlap = getTransitionOverlapRange(prevClip);
				if (prevOverlap && currentTime >= prevOverlap.start && currentTime < prevOverlap.end) {
					continue; // 이미 위에서 처리됨
				}
			}

			// 일반적인 클립 가시성 체크
			if (currentTime >= clip.startTime && currentTime < clipEnd) {
				const elapsed = currentTime - clip.startTime;
				result.push({
					clip,
					trackId: track.id,
					localTime: clip.inPoint + elapsed,
					muted: track.muted || undefined,
				});
			}
		}
	}

	return result;
}

export interface VisibleTextClip {
	textClip: TextClip;
	trackId: string;
}

export interface VisibleAudioClip {
	clip: Clip;
	trackId: string;
	localTime: number;
}

export function getVisibleAudioClipsAtTime(
	tracks: Track[],
	currentTime: number,
): VisibleAudioClip[] {
	const result: VisibleAudioClip[] = [];

	for (const track of tracks) {
		if (track.type !== "audio") continue;
		if (track.muted) continue;

		for (const clip of track.clips) {
			const clipEnd = clip.startTime + clip.duration;
			if (currentTime >= clip.startTime && currentTime < clipEnd) {
				const elapsed = currentTime - clip.startTime;
				result.push({
					clip,
					trackId: track.id,
					localTime: clip.inPoint + elapsed,
				});
			}
		}
	}

	return result;
}

export function getVisibleTextClipsAtTime(tracks: Track[], currentTime: number): VisibleTextClip[] {
	const result: VisibleTextClip[] = [];

	for (const track of tracks) {
		if (track.type !== "text") continue;
		if (track.muted) continue;

		for (const textClip of track.textClips) {
			const end = textClip.startTime + textClip.duration;
			if (currentTime >= textClip.startTime && currentTime < end) {
				result.push({ textClip, trackId: track.id });
			}
		}
	}

	return result;
}
