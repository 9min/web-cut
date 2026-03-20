import { MIN_CLIP_DURATION, SNAP_THRESHOLD_PX } from "@/constants/timeline";
import type { Clip } from "@/types/timeline";

export function splitClipAt(
	clip: Clip,
	splitTime: number,
	leftId: string,
	rightId: string,
): [Clip, Clip] | null {
	const clipEnd = clip.startTime + clip.duration;

	if (splitTime <= clip.startTime || splitTime >= clipEnd) return null;

	const leftDuration = splitTime - clip.startTime;
	const rightDuration = clipEnd - splitTime;

	if (leftDuration < MIN_CLIP_DURATION || rightDuration < MIN_CLIP_DURATION) return null;

	const leftInPoint = clip.inPoint;
	const leftOutPoint = clip.inPoint + leftDuration;
	const rightInPoint = leftOutPoint;
	const rightOutPoint = clip.outPoint;

	const left: Clip = {
		...clip,
		id: leftId,
		duration: leftDuration,
		inPoint: leftInPoint,
		outPoint: leftOutPoint,
	};

	const right: Clip = {
		...clip,
		id: rightId,
		startTime: splitTime,
		duration: rightDuration,
		inPoint: rightInPoint,
		outPoint: rightOutPoint,
	};

	return [left, right];
}

export function trimClip(clip: Clip, newStartTime: number, newEndTime: number): Clip {
	const originalStart = clip.startTime;
	const startDelta = newStartTime - originalStart;

	let duration = newEndTime - newStartTime;
	if (duration < MIN_CLIP_DURATION) {
		duration = MIN_CLIP_DURATION;
	}

	return {
		...clip,
		startTime: newStartTime,
		duration,
		inPoint: clip.inPoint + startDelta,
		outPoint: clip.inPoint + startDelta + duration,
	};
}

export function snapTime(time: number, snapPoints: number[], zoom: number): number {
	if (snapPoints.length === 0) return time;

	const thresholdTime = SNAP_THRESHOLD_PX / zoom;
	let closest = time;
	let minDist = thresholdTime;

	for (const point of snapPoints) {
		const dist = Math.abs(time - point);
		if (dist < minDist) {
			minDist = dist;
			closest = point;
		}
	}

	return closest;
}
