import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore - 편집 모드 액션", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	describe("rippleDelete", () => {
		it("클립 삭제 후 뒤의 클립들을 앞으로 당긴다", () => {
			const clips = [
				createTestClip({ id: "c1", trackId: "t1", startTime: 0, duration: 5 }),
				createTestClip({ id: "c2", trackId: "t1", startTime: 5, duration: 3 }),
				createTestClip({ id: "c3", trackId: "t1", startTime: 8, duration: 4 }),
			];
			const track = createTestTrack({ id: "t1", clips });
			useTimelineStore.getState().addTrack(track);

			useTimelineStore.getState().rippleDelete("t1", "c2");

			const updated = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
			expect(updated?.clips).toHaveLength(2);
			// c3가 c2의 자리로 이동
			const c3 = updated?.clips.find((c) => c.id === "c3");
			expect(c3?.startTime).toBe(5);
		});
	});

	describe("slipEdit", () => {
		it("클립의 in/out 포인트를 변경하되 startTime과 duration은 유지한다", () => {
			const clip = createTestClip({
				id: "c1",
				trackId: "t1",
				startTime: 0,
				duration: 5,
				inPoint: 2,
				outPoint: 7,
			});
			const track = createTestTrack({ id: "t1", clips: [clip] });
			useTimelineStore.getState().addTrack(track);

			useTimelineStore.getState().slipEdit("t1", "c1", 1);

			const updated = useTimelineStore
				.getState()
				.tracks.find((t) => t.id === "t1")
				?.clips.find((c) => c.id === "c1");
			expect(updated?.startTime).toBe(0);
			expect(updated?.duration).toBe(5);
			expect(updated?.inPoint).toBe(3);
			expect(updated?.outPoint).toBe(8);
		});
	});
});
