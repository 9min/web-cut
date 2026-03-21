import { describe, expect, it } from "vitest";
import { ClipTimeIndex } from "@/utils/clipIndex";

describe("ClipTimeIndex", () => {
	it("빈 인덱스에서 빈 배열을 반환한다", () => {
		const index = new ClipTimeIndex([]);
		expect(index.getClipsAtTime(5)).toHaveLength(0);
	});

	it("시간에 해당하는 클립을 찾는다", () => {
		const clips = [
			{ id: "a", startTime: 0, duration: 10 },
			{ id: "b", startTime: 5, duration: 10 },
			{ id: "c", startTime: 20, duration: 5 },
		];
		const index = new ClipTimeIndex(clips);

		const at7 = index.getClipsAtTime(7);
		expect(at7.map((c) => c.id)).toEqual(["a", "b"]);

		const at22 = index.getClipsAtTime(22);
		expect(at22.map((c) => c.id)).toEqual(["c"]);
	});

	it("범위 밖의 시간에서 빈 배열을 반환한다", () => {
		const clips = [{ id: "a", startTime: 5, duration: 5 }];
		const index = new ClipTimeIndex(clips);

		expect(index.getClipsAtTime(0)).toHaveLength(0);
		expect(index.getClipsAtTime(15)).toHaveLength(0);
	});
});
