import { describe, expect, it } from "vitest";
import type { Clip } from "@/types/timeline";
import {
	canAddTransition,
	getTransitionOverlapRange,
	getTransitionProgress,
	validateTransitionDuration,
} from "@/utils/transitionUtils";

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

describe("canAddTransition", () => {
	it("다음 클립이 존재하면 true를 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 5 });
		const nextClip = makeClip({ id: "clip-2", startTime: 5, duration: 5 });
		expect(canAddTransition(clip, nextClip)).toBe(true);
	});

	it("다음 클립이 없으면 false를 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 5 });
		expect(canAddTransition(clip, undefined)).toBe(false);
	});

	it("이미 outTransition이 있으면 false를 반환한다", () => {
		const clip = makeClip({
			startTime: 0,
			duration: 5,
			outTransition: { type: "fade", duration: 0.5 },
		});
		const nextClip = makeClip({ id: "clip-2", startTime: 5, duration: 5 });
		expect(canAddTransition(clip, nextClip)).toBe(false);
	});

	it("클립 duration이 최소 트랜지션 duration보다 짧으면 false를 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 0.2 });
		const nextClip = makeClip({ id: "clip-2", startTime: 0.2, duration: 5 });
		expect(canAddTransition(clip, nextClip)).toBe(false);
	});

	it("다음 클립 duration이 최소 트랜지션 duration보다 짧으면 false를 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 5 });
		const nextClip = makeClip({ id: "clip-2", startTime: 5, duration: 0.2 });
		expect(canAddTransition(clip, nextClip)).toBe(false);
	});
});

describe("validateTransitionDuration", () => {
	it("유효한 duration을 그대로 반환한다", () => {
		const clip = makeClip({ duration: 10 });
		const nextClip = makeClip({ id: "clip-2", duration: 10 });
		expect(validateTransitionDuration(clip, nextClip, 1.0)).toBe(1.0);
	});

	it("최솟값 미만이면 최솟값으로 클램핑한다", () => {
		const clip = makeClip({ duration: 10 });
		const nextClip = makeClip({ id: "clip-2", duration: 10 });
		expect(validateTransitionDuration(clip, nextClip, 0.1)).toBe(0.3);
	});

	it("최댓값 초과하면 최댓값으로 클램핑한다", () => {
		const clip = makeClip({ duration: 10 });
		const nextClip = makeClip({ id: "clip-2", duration: 10 });
		expect(validateTransitionDuration(clip, nextClip, 5.0)).toBe(2.0);
	});

	it("두 클립 중 짧은 쪽 duration을 초과하지 않도록 클램핑한다", () => {
		const clip = makeClip({ duration: 1.0 });
		const nextClip = makeClip({ id: "clip-2", duration: 0.8 });
		expect(validateTransitionDuration(clip, nextClip, 1.5)).toBe(0.8);
	});
});

describe("getTransitionProgress", () => {
	it("트랜지션 시작 시점에서 0을 반환한다", () => {
		expect(getTransitionProgress(5, 5, 1)).toBe(0);
	});

	it("트랜지션 종료 시점에서 1을 반환한다", () => {
		expect(getTransitionProgress(6, 5, 1)).toBe(1);
	});

	it("트랜지션 중간 시점에서 0.5를 반환한다", () => {
		expect(getTransitionProgress(5.5, 5, 1)).toBeCloseTo(0.5);
	});

	it("트랜지션 이전이면 0을 반환한다", () => {
		expect(getTransitionProgress(4, 5, 1)).toBe(0);
	});

	it("트랜지션 이후이면 1을 반환한다", () => {
		expect(getTransitionProgress(7, 5, 1)).toBe(1);
	});
});

describe("getTransitionOverlapRange", () => {
	it("outTransition이 없으면 null을 반환한다", () => {
		const clip = makeClip({ startTime: 0, duration: 10 });
		expect(getTransitionOverlapRange(clip)).toBeNull();
	});

	it("outTransition이 있으면 overlap 구간을 반환한다", () => {
		const clip = makeClip({
			startTime: 0,
			duration: 10,
			outTransition: { type: "fade", duration: 1 },
		});
		const range = getTransitionOverlapRange(clip);
		expect(range).toEqual({ start: 9, end: 10 });
	});

	it("duration이 2인 트랜지션의 overlap 구간을 올바르게 계산한다", () => {
		const clip = makeClip({
			startTime: 5,
			duration: 5,
			outTransition: { type: "dissolve", duration: 2 },
		});
		const range = getTransitionOverlapRange(clip);
		expect(range).toEqual({ start: 8, end: 10 });
	});
});
