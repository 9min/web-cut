import type { Clip, Track } from "@/types/timeline";

export interface VisibleClip {
	clip: Clip;
	trackId: string;
	localTime: number;
}

export function getVisibleClipsAtTime(tracks: Track[], currentTime: number): VisibleClip[] {
	const result: VisibleClip[] = [];

	for (const track of tracks) {
		if (track.type !== "video") continue;

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
