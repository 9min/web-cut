import { describe, expect, it } from "vitest";
import type { Clip } from "@/types/timeline";
import { computePreviewOffsets } from "@/utils/previewOffsets";

function makeClip(startTime: number, duration: number, id: string): Clip {
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

describe("computePreviewOffsets", () => {
	const ZOOM = 100;

	it("삽입 인덱스 이후 클립들에 gap 만큼의 오프셋을 반환한다", () => {
		// 이미 밀착된 클립들: a(0-3), b(3-6), c(6-9)
		// dropIndex=1, gap=2 → 밀착: a→0, gap(3-5), b→5, c→8
		// a: 0→0 offset=0, b: 3→5 offset=200, c: 6→8 offset=200
		const clips = [makeClip(0, 3, "a"), makeClip(3, 3, "b"), makeClip(6, 3, "c")];
		const gapDuration = 2;
		const result = computePreviewOffsets(clips, 1, gapDuration, ZOOM);

		expect(result.get("a")).toBe(0);
		expect(result.get("b")).toBe(200);
		expect(result.get("c")).toBe(200);
	});

	it("삽입 인덱스가 0이면 모든 클립이 밀린다", () => {
		// a(0-3), b(3-6), dropIndex=0, gap=2
		// 밀착: gap(0-2), a→2, b→5
		// a: 0→2 offset=200, b: 3→5 offset=200
		const clips = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		const result = computePreviewOffsets(clips, 0, 2, ZOOM);

		expect(result.get("a")).toBe(200);
		expect(result.get("b")).toBe(200);
	});

	it("삽입 인덱스가 끝이면 아무 클립도 밀리지 않는다", () => {
		// a(0-3), b(3-6), dropIndex=2, gap=2
		// 밀착: a→0, b→3 (gap은 끝에 추가되므로 클립에 영향 없음)
		const clips = [makeClip(0, 3, "a"), makeClip(3, 3, "b")];
		const result = computePreviewOffsets(clips, 2, 2, ZOOM);

		expect(result.get("a")).toBe(0);
		expect(result.get("b")).toBe(0);
	});

	it("빈 클립 목록이면 빈 맵을 반환한다", () => {
		const result = computePreviewOffsets([], 0, 2, ZOOM);
		expect(result.size).toBe(0);
	});

	it("줌 레벨에 따라 오프셋 px이 달라진다", () => {
		const clips = [makeClip(0, 3, "a")];
		const result50 = computePreviewOffsets(clips, 0, 2, 50);
		const result200 = computePreviewOffsets(clips, 0, 2, 200);

		expect(result50.get("a")).toBe(100); // 2 * 50
		expect(result200.get("a")).toBe(400); // 2 * 200
	});

	it("before 클립에 갭이 있으면 왼쪽으로 당기는 오프셋을 반환한다", () => {
		// B(5-10), C(10-15) → dropIndex=1, gap=5
		// 밀착: B→0, gap(5-10), C→10
		// B: 5→0 offset=-500, C: 10→10 offset=0
		const clips = [makeClip(5, 5, "b"), makeClip(10, 5, "c")];
		const result = computePreviewOffsets(clips, 1, 5, ZOOM);
		expect(result.get("b")).toBe(-500);
		expect(result.get("c")).toBe(0);
	});
});
