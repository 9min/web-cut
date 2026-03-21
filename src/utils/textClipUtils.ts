import { TEXT_CLIP_DEFAULT_DURATION, TEXT_OVERLAY_DEFAULTS } from "@/constants/textOverlay";
import type { TextClip } from "@/types/textOverlay";
import { generateId } from "@/utils/generateId";

/** 기존 텍스트 클립과 겹치지 않는 시작 시간을 계산한다 */
export function findNonOverlappingStartTime(
	existingClips: TextClip[],
	startTime: number,
	duration: number,
): number {
	let candidate = startTime;
	const sorted = [...existingClips].sort((a, b) => a.startTime - b.startTime);

	for (const clip of sorted) {
		const clipEnd = clip.startTime + clip.duration;
		const candidateEnd = candidate + duration;
		// 겹치는지 확인
		if (candidate < clipEnd && candidateEnd > clip.startTime) {
			candidate = clipEnd;
		}
	}

	return candidate;
}

export function createDefaultTextClip(
	trackId: string,
	startTime: number,
	existingClips?: TextClip[],
): TextClip {
	const adjustedStart = existingClips
		? findNonOverlappingStartTime(existingClips, startTime, TEXT_CLIP_DEFAULT_DURATION)
		: startTime;

	return {
		id: generateId(),
		trackId,
		name: "새 텍스트",
		startTime: adjustedStart,
		duration: TEXT_CLIP_DEFAULT_DURATION,
		overlay: { ...TEXT_OVERLAY_DEFAULTS },
	};
}
