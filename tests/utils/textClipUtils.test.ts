import { describe, expect, it } from "vitest";
import { TEXT_CLIP_DEFAULT_DURATION, TEXT_OVERLAY_DEFAULTS } from "@/constants/textOverlay";
import { createDefaultTextClip, findNonOverlappingStartTime } from "@/utils/textClipUtils";
import { createTestTextClip } from "../factories/timelineFactory";

describe("createDefaultTextClip", () => {
	it("올바른 구조와 기본값을 가진 TextClip을 생성한다", () => {
		const clip = createDefaultTextClip("track-1", 5);

		expect(clip.id).toBeDefined();
		expect(clip.trackId).toBe("track-1");
		expect(clip.name).toBe("새 텍스트");
		expect(clip.startTime).toBe(5);
		expect(clip.duration).toBe(TEXT_CLIP_DEFAULT_DURATION);
		expect(clip.overlay).toEqual(TEXT_OVERLAY_DEFAULTS);
	});

	it("호출할 때마다 고유한 ID를 생성한다", () => {
		const clip1 = createDefaultTextClip("track-1", 0);
		const clip2 = createDefaultTextClip("track-1", 0);

		expect(clip1.id).not.toBe(clip2.id);
	});

	it("overlay 기본값이 원본을 변경하지 않는다", () => {
		const clip = createDefaultTextClip("track-1", 0);
		clip.overlay.content = "변경됨";

		expect(TEXT_OVERLAY_DEFAULTS.content).toBe("");
	});

	it("기존 클립과 겹치면 뒤로 밀려서 생성된다", () => {
		const existing = [createTestTextClip({ startTime: 0, duration: 3 })];
		const clip = createDefaultTextClip("track-1", 0, existing);

		expect(clip.startTime).toBe(3);
	});
});

describe("findNonOverlappingStartTime", () => {
	it("겹치는 클립이 없으면 원래 시간을 반환한다", () => {
		const result = findNonOverlappingStartTime([], 5, 3);
		expect(result).toBe(5);
	});

	it("겹치는 클립이 있으면 그 뒤로 밀린다", () => {
		const existing = [createTestTextClip({ startTime: 4, duration: 3 })];
		const result = findNonOverlappingStartTime(existing, 5, 3);
		expect(result).toBe(7);
	});

	it("연속으로 겹치는 클립들을 모두 건너뛴다", () => {
		const existing = [
			createTestTextClip({ startTime: 0, duration: 3 }),
			createTestTextClip({ startTime: 3, duration: 3 }),
			createTestTextClip({ startTime: 6, duration: 3 }),
		];
		const result = findNonOverlappingStartTime(existing, 0, 3);
		expect(result).toBe(9);
	});

	it("빈 구간이 있으면 그 위치에 배치한다", () => {
		const existing = [
			createTestTextClip({ startTime: 0, duration: 2 }),
			createTestTextClip({ startTime: 5, duration: 2 }),
		];
		const result = findNonOverlappingStartTime(existing, 2, 3);
		expect(result).toBe(2);
	});
});
