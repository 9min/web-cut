import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore - 트랜스폼", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	describe("updateTransform", () => {
		it("클립에 트랜스폼을 설정한다", () => {
			const track = createTestTrack({ id: "track-1" });
			const clip = createTestClip({ id: "clip-1", trackId: "track-1" });
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().updateTransform("track-1", "clip-1", { x: 30 });
			const updated = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");

			expect(updated?.transform).toBeDefined();
			expect(updated?.transform?.x).toBe(30);
			expect(updated?.transform?.y).toBe(50); // 기본값
		});

		it("기존 트랜스폼을 부분 업데이트한다", () => {
			const track = createTestTrack({ id: "track-1" });
			const clip = createTestClip({
				id: "clip-1",
				trackId: "track-1",
				transform: { x: 30, y: 70, scaleX: 1, scaleY: 1, rotation: 0 },
			});
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().updateTransform("track-1", "clip-1", { rotation: 45 });
			const updated = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");

			expect(updated?.transform?.x).toBe(30);
			expect(updated?.transform?.y).toBe(70);
			expect(updated?.transform?.rotation).toBe(45);
		});
	});

	describe("resetTransform", () => {
		it("트랜스폼을 undefined로 초기화한다", () => {
			const track = createTestTrack({ id: "track-1" });
			const clip = createTestClip({
				id: "clip-1",
				trackId: "track-1",
				transform: { x: 30, y: 70, scaleX: 2, scaleY: 2, rotation: 90 },
			});
			useTimelineStore.setState({ tracks: [{ ...track, clips: [clip] }] });

			useTimelineStore.getState().resetTransform("track-1", "clip-1");
			const updated = useTimelineStore.getState().tracks[0]?.clips.find((c) => c.id === "clip-1");

			expect(updated?.transform).toBeUndefined();
		});
	});
});
