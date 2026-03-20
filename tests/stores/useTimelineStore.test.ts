import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("초기 상태는 빈 트랙 목록이다", () => {
		const state = useTimelineStore.getState();
		expect(state.tracks).toEqual([]);
		expect(state.selectedClipId).toBeNull();
	});

	describe("addTrack", () => {
		it("트랙을 추가한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			expect(useTimelineStore.getState().tracks).toHaveLength(1);
			expect(useTimelineStore.getState().tracks[0]?.id).toBe("t1");
		});

		it("여러 트랙을 추가한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t2" }));
			expect(useTimelineStore.getState().tracks).toHaveLength(2);
		});
	});

	describe("removeTrack", () => {
		it("트랙을 제거한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().removeTrack("t1");
			expect(useTimelineStore.getState().tracks).toHaveLength(0);
		});

		it("존재하지 않는 ID로 제거해도 에러가 발생하지 않는다", () => {
			expect(() => useTimelineStore.getState().removeTrack("non-existent")).not.toThrow();
		});
	});

	describe("addClip", () => {
		it("특정 트랙에 클립을 추가한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);

			const clip = createTestClip({ id: "c1", trackId: "t1" });
			useTimelineStore.getState().addClip("t1", clip);

			const tracks = useTimelineStore.getState().tracks;
			expect(tracks[0]?.clips).toHaveLength(1);
			expect(tracks[0]?.clips[0]?.id).toBe("c1");
		});

		it("존재하지 않는 트랙에 추가하면 무시한다", () => {
			const clip = createTestClip();
			useTimelineStore.getState().addClip("non-existent", clip);
			expect(useTimelineStore.getState().tracks).toHaveLength(0);
		});
	});

	describe("removeClip", () => {
		it("특정 트랙에서 클립을 제거한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().removeClip("t1", "c1");
			expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
		});

		it("선택된 클립을 제거하면 selectedClipId가 null이 된다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
			useTimelineStore.getState().selectClip("c1");

			useTimelineStore.getState().removeClip("t1", "c1");
			expect(useTimelineStore.getState().selectedClipId).toBeNull();
		});
	});

	describe("moveClip", () => {
		it("같은 트랙 내에서 클립을 이동한다", () => {
			const track = createTestTrack({ id: "t1" });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore
				.getState()
				.addClip("t1", createTestClip({ id: "c1", trackId: "t1", startTime: 0 }));

			useTimelineStore.getState().moveClip("t1", "c1", "t1", 5);
			expect(useTimelineStore.getState().tracks[0]?.clips[0]?.startTime).toBe(5);
		});

		it("다른 트랙으로 클립을 이동한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
			useTimelineStore.getState().addTrack(createTestTrack({ id: "t2", type: "audio" }));
			useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

			useTimelineStore.getState().moveClip("t1", "c1", "t2", 3);

			expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
			expect(useTimelineStore.getState().tracks[1]?.clips).toHaveLength(1);
			expect(useTimelineStore.getState().tracks[1]?.clips[0]?.startTime).toBe(3);
			expect(useTimelineStore.getState().tracks[1]?.clips[0]?.trackId).toBe("t2");
		});
	});

	describe("selectClip", () => {
		it("클립을 선택한다", () => {
			useTimelineStore.getState().selectClip("c1");
			expect(useTimelineStore.getState().selectedClipId).toBe("c1");
		});

		it("null로 선택을 해제한다", () => {
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().selectClip(null);
			expect(useTimelineStore.getState().selectedClipId).toBeNull();
		});
	});

	describe("reset", () => {
		it("모든 상태를 초기화한다", () => {
			useTimelineStore.getState().addTrack(createTestTrack());
			useTimelineStore.getState().selectClip("c1");
			useTimelineStore.getState().reset();

			const state = useTimelineStore.getState();
			expect(state.tracks).toEqual([]);
			expect(state.selectedClipId).toBeNull();
		});
	});
});
