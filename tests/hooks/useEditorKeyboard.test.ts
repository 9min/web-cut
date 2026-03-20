import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorKeyboard } from "@/hooks/useEditorKeyboard";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

describe("useEditorKeyboard", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
		usePlaybackStore.getState().reset();
	});

	it("Space 키로 재생/정지를 토글한다", () => {
		renderHook(() => useEditorKeyboard());

		window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
		expect(usePlaybackStore.getState().isPlaying).toBe(true);

		window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
		expect(usePlaybackStore.getState().isPlaying).toBe(false);
	});

	it("Delete 키로 선택된 클립을 삭제한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
		useTimelineStore.getState().selectClip("c1");

		renderHook(() => useEditorKeyboard());

		window.dispatchEvent(new KeyboardEvent("keydown", { code: "Delete" }));
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
	});

	it("Backspace 키로도 선택된 클립을 삭제한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
		useTimelineStore.getState().selectClip("c1");

		renderHook(() => useEditorKeyboard());

		window.dispatchEvent(new KeyboardEvent("keydown", { code: "Backspace" }));
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
	});

	it("선택된 클립이 없으면 Delete를 무시한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

		renderHook(() => useEditorKeyboard());

		window.dispatchEvent(new KeyboardEvent("keydown", { code: "Delete" }));
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(1);
	});
});
