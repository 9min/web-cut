import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import {
	getVisibleAudioClipsAtTime,
	getVisibleClipsAtTime,
	getVisibleTextClipsAtTime,
} from "@/utils/previewUtils";

function makeClip(overrides: Partial<Clip> = {}): Clip {
	return {
		id: "clip-1",
		trackId: "track-1",
		assetId: "asset-1",
		name: "테스트",
		startTime: 0,
		duration: 10,
		inPoint: 0,
		outPoint: 10,
		...overrides,
	};
}

function makeTrack(clips: Clip[], overrides: Partial<Track> = {}): Track {
	return {
		id: "track-1",
		name: "비디오 1",
		type: "video",
		clips,
		textClips: [],
		muted: false,
		locked: false,
		order: 0,
		...overrides,
	};
}

describe("뮤트된 트랙 동작", () => {
	it("뮤트된 비디오 트랙의 클립은 영상은 보이되 muted 플래그가 설정된다", () => {
		const tracks = [
			makeTrack([makeClip({ id: "a" })], { id: "t1", muted: true }),
			makeTrack([makeClip({ id: "b" })], { id: "t2", muted: false }),
		];
		const result = getVisibleClipsAtTime(tracks, 3);
		expect(result).toHaveLength(2);
		const mutedClip = result.find((r) => r.clip.id === "a");
		const unmutedClip = result.find((r) => r.clip.id === "b");
		expect(mutedClip?.muted).toBe(true);
		expect(unmutedClip?.muted).toBeUndefined();
	});

	it("뮤트된 오디오 트랙의 클립은 getVisibleAudioClipsAtTime에서 제외된다", () => {
		const tracks = [
			makeTrack([makeClip({ id: "a" })], { id: "t1", type: "audio", muted: true }),
			makeTrack([makeClip({ id: "b" })], { id: "t2", type: "audio", muted: false }),
		];
		const result = getVisibleAudioClipsAtTime(tracks, 3);
		expect(result).toHaveLength(1);
		expect(result[0]?.clip.id).toBe("b");
	});

	it("뮤트된 텍스트 트랙의 클립은 getVisibleTextClipsAtTime에서 제외된다", () => {
		const textClip = {
			id: "tc1",
			trackId: "t1",
			name: "텍스트",
			startTime: 0,
			duration: 10,
			overlay: {
				content: "test",
				x: 50,
				y: 80,
				fontSize: 36,
				fontColor: "#FFFFFF",
				opacity: 100,
			},
		};
		const tracks: Track[] = [
			{
				id: "t1",
				name: "텍스트 1",
				type: "text",
				clips: [],
				textClips: [textClip],
				muted: true,
				locked: false,
				order: 0,
			},
			{
				id: "t2",
				name: "텍스트 2",
				type: "text",
				clips: [],
				textClips: [{ ...textClip, id: "tc2", trackId: "t2" }],
				muted: false,
				locked: false,
				order: 1,
			},
		];
		const result = getVisibleTextClipsAtTime(tracks, 3);
		expect(result).toHaveLength(1);
		expect(result[0]?.textClip.id).toBe("tc2");
	});

	it("뮤트되지 않은 비디오 트랙의 클립은 muted 플래그 없이 반환된다", () => {
		const tracks = [makeTrack([makeClip({ id: "a" })], { muted: false })];
		const result = getVisibleClipsAtTime(tracks, 3);
		expect(result).toHaveLength(1);
		expect(result[0]?.muted).toBeUndefined();
	});
});
