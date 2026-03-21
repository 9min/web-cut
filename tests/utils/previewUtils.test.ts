import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import { getVisibleClipsAtTime } from "@/utils/previewUtils";

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

describe("getVisibleClipsAtTime", () => {
	it("현재 시간에 활성화된 클립을 반환한다", () => {
		const clips = [makeClip({ id: "a", startTime: 0, duration: 5 })];
		const tracks = [makeTrack(clips)];
		const result = getVisibleClipsAtTime(tracks, 3);

		expect(result).toHaveLength(1);
		expect(result[0]?.clip.id).toBe("a");
	});

	it("현재 시간에 해당하지 않는 클립은 제외한다", () => {
		const clips = [makeClip({ id: "a", startTime: 5, duration: 5 })];
		const tracks = [makeTrack(clips)];
		const result = getVisibleClipsAtTime(tracks, 2);

		expect(result).toHaveLength(0);
	});

	it("여러 트랙에서 동시에 활성화된 클립을 반환한다", () => {
		const tracks = [
			makeTrack([makeClip({ id: "a", startTime: 0, duration: 10 })], { id: "t1" }),
			makeTrack([makeClip({ id: "b", startTime: 2, duration: 5, trackId: "t2" })], {
				id: "t2",
			}),
		];
		const result = getVisibleClipsAtTime(tracks, 3);

		expect(result).toHaveLength(2);
	});

	it("오디오 트랙은 제외한다", () => {
		const tracks = [
			makeTrack([makeClip({ id: "a" })], { type: "video" }),
			makeTrack([makeClip({ id: "b" })], { id: "t2", type: "audio" }),
		];
		const result = getVisibleClipsAtTime(tracks, 3);

		expect(result).toHaveLength(1);
		expect(result[0]?.clip.id).toBe("a");
	});

	it("클립 내 미디어 시간(localTime)을 올바르게 계산한다", () => {
		const clip = makeClip({ startTime: 5, duration: 10, inPoint: 2, outPoint: 12 });
		const tracks = [makeTrack([clip])];
		const result = getVisibleClipsAtTime(tracks, 8);

		expect(result[0]?.localTime).toBe(5); // inPoint(2) + (8 - 5) = 5
	});

	it("트랜지션 없으면 transitionProgress가 없다", () => {
		const clips = [makeClip({ id: "a", startTime: 0, duration: 5 })];
		const tracks = [makeTrack(clips)];
		const result = getVisibleClipsAtTime(tracks, 3);

		expect(result[0]?.transitionProgress).toBeUndefined();
		expect(result[0]?.isOutgoing).toBeUndefined();
	});

	it("트랜지션 구간에서 outgoing+incoming 두 클립을 반환한다", () => {
		const clips = [
			makeClip({
				id: "a",
				startTime: 0,
				duration: 5,
				outTransition: { type: "fade", duration: 1 },
			}),
			makeClip({ id: "b", startTime: 5, duration: 5 }),
		];
		const tracks = [makeTrack(clips)];
		// 트랜지션 구간: 4~5
		const result = getVisibleClipsAtTime(tracks, 4.5);

		expect(result).toHaveLength(2);
		const outgoing = result.find((r) => r.isOutgoing);
		const incoming = result.find((r) => !r.isOutgoing);
		expect(outgoing?.clip.id).toBe("a");
		expect(incoming?.clip.id).toBe("b");
		expect(outgoing?.transitionProgress).toBeCloseTo(0.5);
		expect(outgoing?.transitionType).toBe("fade");
	});

	it("트랜지션 구간 밖에서는 단일 클립만 반환한다", () => {
		const clips = [
			makeClip({
				id: "a",
				startTime: 0,
				duration: 5,
				outTransition: { type: "fade", duration: 1 },
			}),
			makeClip({ id: "b", startTime: 5, duration: 5 }),
		];
		const tracks = [makeTrack(clips)];
		const result = getVisibleClipsAtTime(tracks, 2);

		expect(result).toHaveLength(1);
		expect(result[0]?.clip.id).toBe("a");
		expect(result[0]?.transitionProgress).toBeUndefined();
	});
});
