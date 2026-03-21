import type { TextClip, TextOverlay } from "@/types/textOverlay";
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
		textClips: [],
		muted: false,
		locked: false,
		order: 0,
		...overrides,
	};
}

export function createTestTextClip(overrides: Partial<TextClip> = {}): TextClip {
	return {
		id: generateId(),
		trackId: overrides.trackId ?? "track-1",
		name: "텍스트 클립",
		startTime: 0,
		duration: 3,
		overlay: {
			content: "테스트 텍스트",
			x: 50,
			y: 80,
			fontSize: 36,
			fontColor: "#FFFFFF",
			opacity: 100,
		},
		...overrides,
	};
}

export function createTestOverlay(overrides: Partial<TextOverlay> = {}): TextOverlay {
	return {
		content: "테스트 텍스트",
		x: 50,
		y: 80,
		fontSize: 36,
		fontColor: "#FFFFFF",
		opacity: 100,
		...overrides,
	};
}
