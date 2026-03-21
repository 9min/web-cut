import { beforeEach, describe, expect, it } from "vitest";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestTrack } from "../factories/timelineFactory";

describe("트랙 뮤트/잠금 토글", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	describe("toggleTrackMuted", () => {
		it("뮤트되지 않은 트랙을 뮤트한다", () => {
			const track = createTestTrack({ id: "t1", muted: false });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().toggleTrackMuted("t1");

			const updated = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
			expect(updated?.muted).toBe(true);
		});

		it("뮤트된 트랙을 뮤트 해제한다", () => {
			const track = createTestTrack({ id: "t1", muted: true });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().toggleTrackMuted("t1");

			const updated = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
			expect(updated?.muted).toBe(false);
		});

		it("존재하지 않는 트랙 ID는 무시한다", () => {
			const before = useTimelineStore.getState().tracks;
			useTimelineStore.getState().toggleTrackMuted("nonexistent");
			const after = useTimelineStore.getState().tracks;
			expect(after).toEqual(before);
		});
	});

	describe("toggleTrackLocked", () => {
		it("잠기지 않은 트랙을 잠근다", () => {
			const track = createTestTrack({ id: "t1", locked: false });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().toggleTrackLocked("t1");

			const updated = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
			expect(updated?.locked).toBe(true);
		});

		it("잠긴 트랙을 잠금 해제한다", () => {
			const track = createTestTrack({ id: "t1", locked: true });
			useTimelineStore.getState().addTrack(track);
			useTimelineStore.getState().toggleTrackLocked("t1");

			const updated = useTimelineStore.getState().tracks.find((t) => t.id === "t1");
			expect(updated?.locked).toBe(false);
		});
	});
});
