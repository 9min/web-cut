import { MAX_TRANSITION_DURATION, MIN_TRANSITION_DURATION } from "@/constants/transition";
import type { Clip } from "@/types/timeline";

/** 트랜지션을 추가할 수 있는지 검증한다 */
export function canAddTransition(clip: Clip, nextClip: Clip | undefined): boolean {
	if (!nextClip) return false;
	if (clip.outTransition) return false;
	if (clip.duration < MIN_TRANSITION_DURATION) return false;
	if (nextClip.duration < MIN_TRANSITION_DURATION) return false;
	return true;
}

/** 트랜지션 duration을 유효 범위로 클램핑한다 */
export function validateTransitionDuration(clip: Clip, nextClip: Clip, duration: number): number {
	const maxByClips = Math.min(clip.duration, nextClip.duration);
	const max = Math.min(MAX_TRANSITION_DURATION, maxByClips);
	const min = MIN_TRANSITION_DURATION;
	return Math.max(min, Math.min(max, duration));
}

/** 현재 시간에서 트랜지션 진행률(0~1)을 계산한다 */
export function getTransitionProgress(
	currentTime: number,
	transitionStart: number,
	duration: number,
): number {
	if (duration <= 0) return 0;
	const progress = (currentTime - transitionStart) / duration;
	return Math.max(0, Math.min(1, progress));
}

/** 클립의 outTransition 기반 overlap 구간을 계산한다 */
export function getTransitionOverlapRange(clip: Clip): { start: number; end: number } | null {
	if (!clip.outTransition) return null;
	const clipEnd = clip.startTime + clip.duration;
	return {
		start: clipEnd - clip.outTransition.duration,
		end: clipEnd,
	};
}
