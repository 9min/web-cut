import { describe, expect, it } from "vitest";
import type { Keyframe, KeyframeTrack } from "@/types/keyframe";
import { interpolateKeyframes } from "@/utils/keyframeUtils";

describe("interpolateKeyframes", () => {
	const createTrack = (keyframes: Keyframe[]): KeyframeTrack => ({ keyframes });

	it("키프레임이 없으면 기본값을 반환한다", () => {
		const track = createTrack([]);
		expect(interpolateKeyframes(track, 5, 0)).toBe(0);
	});

	it("키프레임이 1개면 해당 값을 반환한다", () => {
		const track = createTrack([{ time: 0, value: 50, easing: "linear" }]);
		expect(interpolateKeyframes(track, 5, 0)).toBe(50);
	});

	it("시간이 첫 키프레임 이전이면 첫 번째 값을 반환한다", () => {
		const track = createTrack([
			{ time: 2, value: 100, easing: "linear" },
			{ time: 5, value: 200, easing: "linear" },
		]);
		expect(interpolateKeyframes(track, 0, 0)).toBe(100);
	});

	it("시간이 마지막 키프레임 이후면 마지막 값을 반환한다", () => {
		const track = createTrack([
			{ time: 0, value: 100, easing: "linear" },
			{ time: 5, value: 200, easing: "linear" },
		]);
		expect(interpolateKeyframes(track, 10, 0)).toBe(200);
	});

	it("linear 보간이 정확히 중간값을 반환한다", () => {
		const track = createTrack([
			{ time: 0, value: 0, easing: "linear" },
			{ time: 10, value: 100, easing: "linear" },
		]);
		expect(interpolateKeyframes(track, 5, 0)).toBe(50);
	});

	it("3개 키프레임 사이를 정확히 보간한다", () => {
		const track = createTrack([
			{ time: 0, value: 0, easing: "linear" },
			{ time: 5, value: 100, easing: "linear" },
			{ time: 10, value: 50, easing: "linear" },
		]);
		expect(interpolateKeyframes(track, 2.5, 0)).toBe(50);
		expect(interpolateKeyframes(track, 7.5, 0)).toBe(75);
	});

	it("ease-in 보간이 시작에서 느리다", () => {
		const track = createTrack([
			{ time: 0, value: 0, easing: "ease-in" },
			{ time: 10, value: 100, easing: "ease-in" },
		]);
		const midValue = interpolateKeyframes(track, 5, 0);
		// ease-in은 중간지점에서 50보다 작아야 한다
		expect(midValue).toBeLessThan(50);
	});

	it("ease-out 보간이 끝에서 느리다", () => {
		const track = createTrack([
			{ time: 0, value: 0, easing: "ease-out" },
			{ time: 10, value: 100, easing: "ease-out" },
		]);
		const midValue = interpolateKeyframes(track, 5, 0);
		// ease-out은 중간지점에서 50보다 커야 한다
		expect(midValue).toBeGreaterThan(50);
	});
});
