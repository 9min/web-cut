import { describe, expect, it } from "vitest";
import { MIN_CLIP_DURATION } from "@/constants/timeline";
import type { Clip } from "@/types/timeline";
import { splitClipAt, trimClip } from "@/utils/editUtils";

function makeClip(overrides: Partial<Clip> = {}): Clip {
	return {
		id: "clip-1",
		trackId: "track-1",
		assetId: "asset-1",
		name: "테스트 클립",
		startTime: 0,
		duration: 10,
		inPoint: 0,
		outPoint: 10,
		...overrides,
	};
}

describe("splitClipAt", () => {
	it("클립을 지정 시간에 두 조각으로 나눈다", () => {
		const clip = makeClip({ startTime: 2, duration: 10, inPoint: 0, outPoint: 10 });
		const [left, right] = splitClipAt(clip, 7, "left-id", "right-id");

		expect(left.startTime).toBe(2);
		expect(left.duration).toBe(5);
		expect(left.inPoint).toBe(0);
		expect(left.outPoint).toBe(5);
		expect(left.id).toBe("left-id");

		expect(right.startTime).toBe(7);
		expect(right.duration).toBe(5);
		expect(right.inPoint).toBe(5);
		expect(right.outPoint).toBe(10);
		expect(right.id).toBe("right-id");
	});

	it("분할 시간이 클립 범위 밖이면 null을 반환한다", () => {
		const clip = makeClip({ startTime: 2, duration: 10 });
		expect(splitClipAt(clip, 1, "a", "b")).toBeNull();
		expect(splitClipAt(clip, 12, "a", "b")).toBeNull();
		expect(splitClipAt(clip, 2, "a", "b")).toBeNull();
	});

	it("분할 결과가 MIN_CLIP_DURATION 미만이면 null을 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 10 });
		expect(splitClipAt(clip, 0.05, "a", "b")).toBeNull();
		expect(splitClipAt(clip, 9.95, "a", "b")).toBeNull();
	});

	it("원본 클립의 name과 assetId를 유지한다", () => {
		const clip = makeClip({ name: "인트로", assetId: "a-1" });
		const result = splitClipAt(clip, 5, "a", "b");
		expect(result).not.toBeNull();
		const [left, right] = result ?? [];
		expect(left?.name).toBe("인트로");
		expect(right?.assetId).toBe("a-1");
	});
});

describe("trimClip", () => {
	it("시작 지점을 트림한다 (inPoint 증가)", () => {
		const clip = makeClip({ startTime: 2, duration: 10, inPoint: 0, outPoint: 10 });
		const trimmed = trimClip(clip, 5, 12);

		expect(trimmed.startTime).toBe(5);
		expect(trimmed.duration).toBe(7);
		expect(trimmed.inPoint).toBe(3);
		expect(trimmed.outPoint).toBe(10);
	});

	it("끝 지점을 트림한다 (outPoint 감소)", () => {
		const clip = makeClip({ startTime: 2, duration: 10, inPoint: 0, outPoint: 10 });
		const trimmed = trimClip(clip, 2, 8);

		expect(trimmed.startTime).toBe(2);
		expect(trimmed.duration).toBe(6);
		expect(trimmed.inPoint).toBe(0);
		expect(trimmed.outPoint).toBe(6);
	});

	it("양쪽 동시 트림한다", () => {
		const clip = makeClip({ startTime: 0, duration: 10, inPoint: 0, outPoint: 10 });
		const trimmed = trimClip(clip, 2, 7);

		expect(trimmed.startTime).toBe(2);
		expect(trimmed.duration).toBe(5);
		expect(trimmed.inPoint).toBe(2);
		expect(trimmed.outPoint).toBe(7);
	});

	it("최소 길이 미만으로 트림하면 최소 길이를 유지한다", () => {
		const clip = makeClip({ startTime: 0, duration: 10 });
		const trimmed = trimClip(clip, 5, 5.05);

		expect(trimmed.duration).toBeGreaterThanOrEqual(MIN_CLIP_DURATION);
	});
});
