import type { Clip, Track, TrackType } from "@/types/timeline";
import { generateId } from "@/utils/generateId";

export function createTestClip(overrides: Partial<Clip> = {}): Clip {
	const duration = overrides.duration ?? 5;
	return {
		id: generateId(),
		trackId: overrides.trackId ?? "track-1",
		assetId: "asset-1",
		name: "테스트 클립",
		startTime: 0,
		duration,
		inPoint: 0,
		outPoint: duration,
		...overrides,
	};
}

export function createTestTrack(overrides: Partial<Track> = {}): Track {
	return {
		id: generateId(),
		name: "비디오 1",
		type: "video" as TrackType,
		clips: [],
		muted: false,
		locked: false,
		order: 0,
		...overrides,
	};
}
