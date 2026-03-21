import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useTimelineStore - trimClipByEdge", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("왼쪽 트림: startTime 증가, duration 감소, inPoint 증가", () => {
		const clip = createTestClip({
			id: "c1",
			trackId: "t1",
			startTime: 0,
			duration: 10,
			inPoint: 0,
			outPoint: 10,
		});
		const track = createTestTrack({ id: "t1", clips: [clip] });
		useTimelineStore.getState().addTrack(track);

		useTimelineStore.getState().trimClipByEdge("t1", "c1", "left", 2);

		const updated = useTimelineStore
			.getState()
			.tracks.find((t) => t.id === "t1")
			?.clips.find((c) => c.id === "c1");
		expect(updated?.startTime).toBe(2);
		expect(updated?.duration).toBe(8);
		expect(updated?.inPoint).toBe(2);
	});

	it("오른쪽 트림: duration 변경, outPoint 변경", () => {
		const clip = createTestClip({
			id: "c1",
			trackId: "t1",
			startTime: 0,
			duration: 10,
			inPoint: 0,
			outPoint: 10,
		});
		const track = createTestTrack({ id: "t1", clips: [clip] });
		useTimelineStore.getState().addTrack(track);

		useTimelineStore.getState().trimClipByEdge("t1", "c1", "right", -3);

		const updated = useTimelineStore
			.getState()
			.tracks.find((t) => t.id === "t1")
			?.clips.find((c) => c.id === "c1");
		expect(updated?.duration).toBe(7);
		expect(updated?.outPoint).toBe(7);
	});

	it("최소 duration 0.1초 미만으로 트림되지 않는다", () => {
		const clip = createTestClip({
			id: "c1",
			trackId: "t1",
			startTime: 0,
			duration: 1,
			inPoint: 0,
			outPoint: 1,
		});
		const track = createTestTrack({ id: "t1", clips: [clip] });
		useTimelineStore.getState().addTrack(track);

		useTimelineStore.getState().trimClipByEdge("t1", "c1", "left", 0.95);

		const updated = useTimelineStore
			.getState()
			.tracks.find((t) => t.id === "t1")
			?.clips.find((c) => c.id === "c1");
		expect(updated?.duration).toBeGreaterThanOrEqual(0.1 - Number.EPSILON);
	});
});
