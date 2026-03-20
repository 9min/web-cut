import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import {
	detectOverlap,
	findInsertPosition,
	findOverlappingClips,
	getClipEnd,
	getTimelineDuration,
	getTrackDuration,
	pixelToTime,
	timeToPixel,
} from "@/utils/timelineUtils";

function makeClip(startTime: number, duration: number, id = "clip-1"): Clip {
	return {
		id,
		trackId: "track-1",
		assetId: "asset-1",
		name: "테스트 클립",
		startTime,
		duration,
		inPoint: 0,
		outPoint: duration,
	};
}

function makeTrack(clips: Clip[], id = "track-1"): Track {
	return {
		id,
		name: "비디오 1",
		type: "video",
		clips,
		muted: false,
		locked: false,
		order: 0,
	};
}

describe("timeToPixel", () => {
	it("0초는 0px이다", () => {
		expect(timeToPixel(0, 100)).toBe(0);
	});

	it("시간을 줌 레벨에 따라 픽셀로 변환한다", () => {
		expect(timeToPixel(1, 100)).toBe(100);
		expect(timeToPixel(2.5, 200)).toBe(500);
	});
});

describe("pixelToTime", () => {
	it("0px는 0초이다", () => {
		expect(pixelToTime(0, 100)).toBe(0);
	});

	it("픽셀을 줌 레벨에 따라 시간으로 변환한다", () => {
		expect(pixelToTime(100, 100)).toBe(1);
		expect(pixelToTime(500, 200)).toBe(2.5);
	});

	it("음수 픽셀은 0으로 클램핑한다", () => {
		expect(pixelToTime(-50, 100)).toBe(0);
	});
});

describe("getClipEnd", () => {
	it("클립의 종료 시간을 반환한다", () => {
		expect(getClipEnd(makeClip(2, 3))).toBe(5);
	});
});

describe("detectOverlap", () => {
	it("겹치는 클립을 감지한다", () => {
		expect(detectOverlap(makeClip(0, 5), makeClip(3, 5))).toBe(true);
	});

	it("인접한 클립은 겹치지 않는다", () => {
		expect(detectOverlap(makeClip(0, 5), makeClip(5, 3))).toBe(false);
	});

	it("떨어진 클립은 겹치지 않는다", () => {
		expect(detectOverlap(makeClip(0, 2), makeClip(5, 3))).toBe(false);
	});

	it("완전히 포함되는 경우를 감지한다", () => {
		expect(detectOverlap(makeClip(0, 10), makeClip(2, 3))).toBe(true);
	});
});

describe("findOverlappingClips", () => {
	it("겹치는 클립만 반환한다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(5, 3, "b"), makeClip(7, 3, "c")];
		const target = makeClip(4, 4, "target");
		const result = findOverlappingClips(clips, target);
		expect(result.map((c) => c.id)).toEqual(["b", "c"]);
	});

	it("자기 자신을 제외한다", () => {
		const clip = makeClip(0, 5, "a");
		const clips = [clip, makeClip(3, 5, "b")];
		const result = findOverlappingClips(clips, clip);
		expect(result.map((c) => c.id)).toEqual(["b"]);
	});
});

describe("getTrackDuration", () => {
	it("빈 트랙은 0이다", () => {
		expect(getTrackDuration(makeTrack([]))).toBe(0);
	});

	it("가장 늦게 끝나는 클립의 종료 시간을 반환한다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(5, 10, "b")];
		expect(getTrackDuration(makeTrack(clips))).toBe(15);
	});
});

describe("getTimelineDuration", () => {
	it("빈 트랙 목록은 0이다", () => {
		expect(getTimelineDuration([])).toBe(0);
	});

	it("모든 트랙 중 최대 종료 시간을 반환한다", () => {
		const tracks = [
			makeTrack([makeClip(0, 5, "a")], "t1"),
			makeTrack([makeClip(0, 10, "b")], "t2"),
		];
		expect(getTimelineDuration(tracks)).toBe(10);
	});
});

describe("findInsertPosition", () => {
	it("빈 클립 목록에서는 요청 시간 그대로 반환한다", () => {
		expect(findInsertPosition([], 3, 2)).toBe(3);
	});

	it("겹치지 않는 위치는 그대로 반환한다", () => {
		const clips = [makeClip(0, 3, "a")];
		expect(findInsertPosition(clips, 5, 2)).toBe(5);
	});

	it("겹치는 경우 기존 클립 뒤로 밀어낸다", () => {
		const clips = [makeClip(0, 5, "a")];
		expect(findInsertPosition(clips, 3, 2)).toBe(5);
	});

	it("여러 클립과 겹치는 경우 마지막 클립 뒤로 밀어낸다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		expect(findInsertPosition(clips, 2, 2)).toBe(6);
	});
});
