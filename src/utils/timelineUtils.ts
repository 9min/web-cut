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
	if (track.clips.length === 0) return 0;
	return Math.max(...track.clips.map(getClipEnd));
}

export function getTimelineDuration(tracks: Track[]): number {
	if (tracks.length === 0) return 0;
	return Math.max(...tracks.map(getTrackDuration));
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
