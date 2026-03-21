import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore - 멀티 클립 선택", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("selectClip으로 단일 선택한다", () => {
		useTimelineStore.getState().selectClip("c1");
		expect(useTimelineStore.getState().selectedClipIds.has("c1")).toBe(true);
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(1);
	});

	it("selectClip(null)로 모든 선택을 해제한다", () => {
		useTimelineStore.getState().selectClip("c1");
		useTimelineStore.getState().selectClip(null);
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
	});

	it("selectClip(id, true)로 추가 선택한다", () => {
		useTimelineStore.getState().selectClip("c1");
		useTimelineStore.getState().selectClip("c2", true);
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(2);
		expect(useTimelineStore.getState().selectedClipIds.has("c1")).toBe(true);
		expect(useTimelineStore.getState().selectedClipIds.has("c2")).toBe(true);
	});

	it("additive로 이미 선택된 클립을 토글 해제한다", () => {
		useTimelineStore.getState().selectClip("c1");
		useTimelineStore.getState().selectClip("c2", true);
		useTimelineStore.getState().selectClip("c1", true);
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(1);
		expect(useTimelineStore.getState().selectedClipIds.has("c2")).toBe(true);
	});

	it("deselectAll로 모든 선택을 해제한다", () => {
		useTimelineStore.getState().selectClip("c1");
		useTimelineStore.getState().selectClip("c2", true);
		useTimelineStore.getState().deselectAll();
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
	});

	it("getSelectedClipId 헬퍼가 Set의 첫 번째 요소를 반환한다", () => {
		expect(useTimelineStore.getState().getSelectedClipId()).toBeNull();

		useTimelineStore.getState().selectClip("c1");
		expect(useTimelineStore.getState().getSelectedClipId()).toBe("c1");
	});

	it("removeSelectedClips로 선택된 클립들을 모두 삭제한다", () => {
		const clip1 = createTestClip({ id: "c1", trackId: "t1", startTime: 0, duration: 5 });
		const clip2 = createTestClip({ id: "c2", trackId: "t1", startTime: 5, duration: 5 });
		const track = createTestTrack({ id: "t1", clips: [clip1, clip2] });
		useTimelineStore.getState().addTrack(track);

		useTimelineStore.getState().selectClip("c1");
		useTimelineStore.getState().selectClip("c2", true);
		useTimelineStore.getState().removeSelectedClips();

		const updatedTrack = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
		expect(updatedTrack?.clips).toHaveLength(0);
		expect(useTimelineStore.getState().selectedClipIds.size).toBe(0);
	});
});
