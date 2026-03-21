import { describe, expect, it } from "vitest";
import type { Clip } from "@/types/timeline";
import { calculateDropPosition } from "@/utils/timelineUtils";

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

describe("calculateDropPosition 스냅 반환값", () => {
	const ZOOM = 100;

	it("스냅 발생 시 snapped: true, snapPoint를 반환한다", () => {
		const otherClips = [makeClip(5, 3, "B")];
		const result = calculateDropPosition(0, 2, 495, ZOOM, otherClips);
		expect(result.position).toBe(5);
		expect(result.snapped).toBe(true);
		expect(result.snapPoint).toBe(5);
	});

	it("스냅 미발생 시 snapped: false를 반환한다", () => {
		const otherClips = [makeClip(5, 3, "B")];
		const result = calculateDropPosition(0, 2, 300, ZOOM, otherClips);
		expect(result.position).toBe(3);
		expect(result.snapped).toBe(false);
		expect(result.snapPoint).toBe(3);
	});

	it("클립 끝 스냅 시 snapPoint는 끝 경계 위치다", () => {
		const otherClips = [makeClip(5, 3, "B")];
		const result = calculateDropPosition(0, 2, 593, ZOOM, otherClips);
		expect(result.position).toBe(6);
		expect(result.snapped).toBe(true);
		expect(result.snapPoint).toBe(8);
	});

	it("빈 클립 목록에서는 snapped: false다", () => {
		const result = calculateDropPosition(0, 3, 200, ZOOM, []);
		expect(result.position).toBe(2);
		expect(result.snapped).toBe(false);
	});
});
