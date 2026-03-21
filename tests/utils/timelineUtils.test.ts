import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import {
	calculateDropPosition,
	detectOverlap,
	findDropIndex,
	findInsertPosition,
	findOverlappingClips,
	getClipEnd,
	getStartTimeAtIndex,
	getTimelineDuration,
	getTrackDuration,
	pixelToTime,
	reorderAndCompact,
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
		textClips: [],
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

describe("calculateDropPosition", () => {
	const ZOOM = 100; // 100px = 1초

	it("deltaX를 시간으로 변환하여 새 위치를 계산한다", () => {
		// 클립 시작 2초, deltaX 300px (zoom 100) = 3초 이동 → 5초
		const result = calculateDropPosition(2, 3, 300, ZOOM, []);
		expect(result).toBe(5);
	});

	it("음수 deltaX로 왼쪽 이동한다", () => {
		// 클립 시작 5초, deltaX -200px = -2초 이동 → 3초
		const result = calculateDropPosition(5, 3, -200, ZOOM, []);
		expect(result).toBe(3);
	});

	it("결과가 0 미만이면 0으로 클램핑한다", () => {
		// 클립 시작 1초, deltaX -500px = -5초 이동 → -4초 → 0으로 클램핑
		const result = calculateDropPosition(1, 3, -500, ZOOM, []);
		expect(result).toBe(0);
	});

	it("다른 클립의 시작 지점에 스냅한다", () => {
		// 클립 시작 0초, deltaX 495px (4.95초) → 클립B 시작(5초)에 스냅
		const otherClips = [makeClip(5, 3, "B")];
		const result = calculateDropPosition(0, 2, 495, ZOOM, otherClips);
		expect(result).toBe(5);
	});

	it("다른 클립의 끝 지점에 스냅한다", () => {
		// 클립 시작 0초, duration 2초, deltaX 593px (5.93초)
		// 시작(5.93) → 가장 가까운 스냅 포인트 5와 거리 0.93 → 스냅 안됨
		// 끝(7.93) → 클립B 끝(8초)과 거리 0.07 → 스냅됨 → startTime = 8 - 2 = 6
		const otherClips = [makeClip(5, 3, "B")]; // B는 5-8초
		const result = calculateDropPosition(0, 2, 593, ZOOM, otherClips);
		expect(result).toBe(6);
	});

	it("스냅 범위 밖이면 스냅하지 않는다", () => {
		// 클립 시작 0초, deltaX 300px (3초) → 클립B(5초)와 2초 떨어짐 → 스냅 안됨
		const otherClips = [makeClip(5, 3, "B")];
		const result = calculateDropPosition(0, 2, 300, ZOOM, otherClips);
		expect(result).toBe(3);
	});

	it("빈 클립 목록에서는 deltaX만 반영한다", () => {
		const result = calculateDropPosition(0, 3, 200, ZOOM, []);
		expect(result).toBe(2);
	});

	it("resolveOverlapSnap 없이 겹침이 있어도 계산된 위치를 그대로 반환한다", () => {
		// 클립 시작 0초, deltaX 100px (1초) → 1초 위치. B(0-5)와 겹침
		// resolveOverlapSnap이 없으므로 1초 그대로 반환 (insertClipAt이 처리)
		const otherClips = [makeClip(0, 5, "B")];
		const result = calculateDropPosition(0, 3, 100, ZOOM, otherClips);
		expect(result).toBe(1);
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

describe("findDropIndex", () => {
	it("빈 목록이면 0을 반환한다", () => {
		expect(findDropIndex([], 5)).toBe(0);
	});

	it("모든 클립의 midpoint 이전이면 0을 반환한다", () => {
		const clips = [makeClip(0, 4, "a"), makeClip(4, 4, "b")];
		// a의 midpoint = 2, dropTime 1 < 2 → index 0
		expect(findDropIndex(clips, 1)).toBe(0);
	});

	it("첫 번째 클립 midpoint 이후, 두 번째 midpoint 이전이면 1을 반환한다", () => {
		const clips = [makeClip(0, 4, "a"), makeClip(4, 4, "b")];
		// a midpoint=2, b midpoint=6, dropTime 3 → index 1
		expect(findDropIndex(clips, 3)).toBe(1);
	});

	it("모든 클립의 midpoint를 초과하면 length를 반환한다", () => {
		const clips = [makeClip(0, 4, "a"), makeClip(4, 4, "b")];
		// b midpoint=6, dropTime 7 → index 2
		expect(findDropIndex(clips, 7)).toBe(2);
	});

	it("midpoint와 정확히 같으면 해당 인덱스 다음을 반환한다", () => {
		const clips = [makeClip(0, 4, "a")];
		// midpoint=2, dropTime=2 → 같으면 다음(index 1)
		expect(findDropIndex(clips, 2)).toBe(1);
	});

	it("3개 이상의 클립에서 중간 삽입을 올바르게 찾는다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(3, 3, "b"), makeClip(6, 3, "c")];
		// b midpoint=4.5, dropTime 5.5 > 4.5 → index 2
		// c midpoint=7.5, dropTime 5.5 < 7.5 → index 2
		expect(findDropIndex(clips, 5.5)).toBe(2);
	});
});

describe("getStartTimeAtIndex", () => {
	it("index 0이면 0을 반환한다", () => {
		const clips = [makeClip(0, 3, "a")];
		expect(getStartTimeAtIndex(clips, 0)).toBe(0);
	});

	it("index > 0이면 이전 클립의 끝 시간을 반환한다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(3, 5, "b")];
		expect(getStartTimeAtIndex(clips, 1)).toBe(3);
	});

	it("마지막 인덱스(length)이면 마지막 클립의 끝 시간을 반환한다", () => {
		const clips = [makeClip(0, 3, "a"), makeClip(3, 5, "b")];
		expect(getStartTimeAtIndex(clips, 2)).toBe(8);
	});
});

describe("reorderAndCompact", () => {
	it("index 0에 삽입하면 모든 클립이 뒤로 밀착된다", () => {
		const others = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		const insert = makeClip(0, 2, "x");
		const result = reorderAndCompact(others, insert, 0);
		expect(result.map((c) => [c.id, c.startTime, c.startTime + c.duration])).toEqual([
			["x", 0, 2],
			["a", 2, 5],
			["b", 5, 8],
		]);
	});

	it("중간에 삽입하면 before는 그대로, after는 밀착된다", () => {
		const others = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		const insert = makeClip(0, 2, "x");
		const result = reorderAndCompact(others, insert, 1);
		expect(result.map((c) => [c.id, c.startTime, c.startTime + c.duration])).toEqual([
			["a", 0, 3],
			["x", 3, 5],
			["b", 5, 8],
		]);
	});

	it("마지막에 삽입하면 before 클립들은 그대로이다", () => {
		const others = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		const insert = makeClip(0, 2, "x");
		const result = reorderAndCompact(others, insert, 2);
		expect(result.map((c) => [c.id, c.startTime, c.startTime + c.duration])).toEqual([
			["a", 0, 3],
			["b", 3, 6],
			["x", 6, 8],
		]);
	});

	it("빈 목록에 삽입하면 시간 0부터 배치된다", () => {
		const insert = makeClip(5, 3, "x");
		const result = reorderAndCompact([], insert, 0);
		expect(result).toHaveLength(1);
		expect(result[0]?.startTime).toBe(0);
	});

	it("삽입 클립의 원래 startTime은 무시된다", () => {
		const others = [makeClip(0, 3, "a")];
		const insert = makeClip(99, 2, "x");
		const result = reorderAndCompact(others, insert, 0);
		expect(result[0]?.startTime).toBe(0);
		expect(result[1]?.startTime).toBe(2);
	});

	it("before 클립에 갭이 있으면 밀착 배치한다", () => {
		const others = [makeClip(5, 3, "b"), makeClip(10, 3, "c")]; // 0-5초 갭
		const insert = makeClip(0, 2, "x");
		const result = reorderAndCompact(others, insert, 1);
		// b는 0에서 시작, x는 3, c는 5
		expect(result.map((c) => [c.id, c.startTime])).toEqual([
			["b", 0],
			["x", 3],
			["c", 5],
		]);
	});
});
