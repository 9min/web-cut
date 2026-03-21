import { SNAP_THRESHOLD_PX } from "@/constants/timeline";
import type { Clip, Track } from "@/types/timeline";

export function timeToPixel(time: number, zoom: number): number {
	return time * zoom;
}

export function pixelToTime(pixel: number, zoom: number): number {
	return Math.max(0, pixel / zoom);
}

export function getClipEnd(clip: Clip): number {
	return clip.startTime + clip.duration;
}

export function detectOverlap(a: Clip, b: Clip): boolean {
	return a.startTime < getClipEnd(b) && getClipEnd(a) > b.startTime;
}

export function findOverlappingClips(clips: Clip[], target: Clip): Clip[] {
	return clips.filter((c) => c.id !== target.id && detectOverlap(c, target));
}

export function getTrackDuration(track: Track): number {
	const clipEnd = track.clips.length > 0 ? Math.max(...track.clips.map(getClipEnd)) : 0;
	const textClipEnd =
		track.textClips.length > 0
			? Math.max(...track.textClips.map((tc) => tc.startTime + tc.duration))
			: 0;
	return Math.max(clipEnd, textClipEnd);
}

export function getTimelineDuration(tracks: Track[]): number {
	if (tracks.length === 0) return 0;
	return Math.max(...tracks.map(getTrackDuration));
}

/** 드래그 중/드롭 시 예상 위치를 계산하는 순수 함수 */
export function calculateDropPosition(
	clipStartTime: number,
	clipDuration: number,
	deltaX: number,
	zoom: number,
	otherClips: Clip[],
): number {
	const deltaTime = (Math.abs(deltaX) / zoom) * (deltaX < 0 ? -1 : 1);
	let newStartTime = Math.max(0, clipStartTime + deltaTime);

	// 스냅 포인트 수집
	const snapPoints: number[] = [0];
	for (const c of otherClips) {
		snapPoints.push(c.startTime, c.startTime + c.duration);
	}

	// 클립의 시작/끝 모두에 대해 스냅 확인
	const thresholdTime = SNAP_THRESHOLD_PX / zoom;

	let snappedStart = newStartTime;
	let minDistStart = thresholdTime;
	for (const point of snapPoints) {
		const dist = Math.abs(newStartTime - point);
		if (dist < minDistStart) {
			minDistStart = dist;
			snappedStart = point;
		}
	}

	const clipEnd = newStartTime + clipDuration;
	let snappedEnd = clipEnd;
	let minDistEnd = thresholdTime;
	for (const point of snapPoints) {
		const dist = Math.abs(clipEnd - point);
		if (dist < minDistEnd) {
			minDistEnd = dist;
			snappedEnd = point;
		}
	}

	if (snappedStart !== newStartTime) {
		newStartTime = snappedStart;
	} else if (snappedEnd !== clipEnd) {
		newStartTime = snappedEnd - clipDuration;
	}

	return Math.max(0, newStartTime);
}

/** midpoint 규칙으로 삽입 인덱스 결정 (sortedClips 필수) */
export function findDropIndex(sortedClips: Clip[], dropTime: number): number {
	for (let i = 0; i < sortedClips.length; i++) {
		const clip = sortedClips[i] as Clip;
		const midpoint = clip.startTime + clip.duration / 2;
		if (dropTime < midpoint) return i;
	}
	return sortedClips.length;
}

/** 해당 인덱스에서의 시작 시간 (이전 클립 끝) */
export function getStartTimeAtIndex(sortedClips: Clip[], index: number): number {
	if (index === 0) return 0;
	const prev = sortedClips[index - 1] as Clip;
	return prev.startTime + prev.duration;
}

/** 삽입 후 전체 밀착 배치 (before 포함) */
export function reorderAndCompact(otherClips: Clip[], insertClip: Clip, index: number): Clip[] {
	const before = otherClips.slice(0, index);
	const after = otherClips.slice(index);
	const result: Clip[] = [];

	// before 클립들도 0부터 밀착 배치
	let currentEnd = 0;
	for (const clip of before) {
		result.push({ ...clip, startTime: currentEnd });
		currentEnd += clip.duration;
	}

	// 삽입 클립
	result.push({ ...insertClip, startTime: currentEnd });
	currentEnd += insertClip.duration;

	// after 클립들 밀착 배치
	for (const clip of after) {
		result.push({ ...clip, startTime: currentEnd });
		currentEnd += clip.duration;
	}

	return result;
}

export function findInsertPosition(clips: Clip[], startTime: number, duration: number): number {
	let position = startTime;
	const tempClip: Clip = {
		id: "__temp__",
		trackId: "",
		assetId: "",
		name: "",
		startTime: position,
		duration,
		inPoint: 0,
		outPoint: duration,
	};

	let overlapping = findOverlappingClips(clips, tempClip);
	while (overlapping.length > 0) {
		position = Math.max(...overlapping.map(getClipEnd));
		tempClip.startTime = position;
		overlapping = findOverlappingClips(clips, tempClip);
	}

	return position;
}
