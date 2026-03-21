import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorKeyboard } from "@/hooks/useEditorKeyboard";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useUIStore } from "@/stores/useUIStore";
import { useZoomStore } from "@/stores/useZoomStore";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

function fireKey(code: string, opts: Partial<KeyboardEventInit> = {}) {
	window.dispatchEvent(new KeyboardEvent("keydown", { code, ...opts }));
}

describe("useEditorKeyboard", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
		useTimelineStore.setState({ tracks: [] });
		usePlaybackStore.getState().reset();
		useUIStore.setState({ showShortcutHelp: false });
		useZoomStore.setState({ zoom: 60 });
	});

	it("Space 키로 재생/정지를 토글한다", () => {
		renderHook(() => useEditorKeyboard());

		fireKey("Space");
		expect(usePlaybackStore.getState().isPlaying).toBe(true);

		fireKey("Space");
		expect(usePlaybackStore.getState().isPlaying).toBe(false);
	});

	it("Delete 키로 선택된 클립을 삭제한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
		useTimelineStore.getState().selectClip("c1");

		renderHook(() => useEditorKeyboard());

		fireKey("Delete");
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
	});

	it("Backspace 키로도 선택된 클립을 삭제한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
		useTimelineStore.getState().selectClip("c1");

		renderHook(() => useEditorKeyboard());

		fireKey("Backspace");
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(0);
	});

	it("선택된 클립이 없으면 Delete를 무시한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));

		renderHook(() => useEditorKeyboard());

		fireKey("Delete");
		expect(useTimelineStore.getState().tracks[0]?.clips).toHaveLength(1);
	});

	it("Escape 키로 selectClip(null)을 호출한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ id: "t1" }));
		useTimelineStore.getState().addClip("t1", createTestClip({ id: "c1", trackId: "t1" }));
		useTimelineStore.getState().selectClip("c1");

		renderHook(() => useEditorKeyboard());

		fireKey("Escape");
		expect(useTimelineStore.getState().selectedClipId).toBeNull();
	});

	it("ArrowLeft로 1프레임 뒤로 이동한다", () => {
		const fps = useProjectStore.getState().fps;
		usePlaybackStore.getState().seek(1);
		usePlaybackStore.getState().setDuration(10);

		renderHook(() => useEditorKeyboard());

		fireKey("ArrowLeft");
		expect(usePlaybackStore.getState().currentTime).toBeCloseTo(1 - 1 / fps);
	});

	it("ArrowRight로 1프레임 앞으로 이동한다", () => {
		const fps = useProjectStore.getState().fps;
		usePlaybackStore.getState().seek(1);
		usePlaybackStore.getState().setDuration(10);

		renderHook(() => useEditorKeyboard());

		fireKey("ArrowRight");
		expect(usePlaybackStore.getState().currentTime).toBeCloseTo(1 + 1 / fps);
	});

	it("Shift+ArrowLeft로 5초 뒤로 이동한다", () => {
		usePlaybackStore.getState().seek(10);
		usePlaybackStore.getState().setDuration(30);

		renderHook(() => useEditorKeyboard());

		fireKey("ArrowLeft", { shiftKey: true });
		expect(usePlaybackStore.getState().currentTime).toBe(5);
	});

	it("Shift+ArrowRight로 5초 앞으로 이동한다", () => {
		usePlaybackStore.getState().seek(10);
		usePlaybackStore.getState().setDuration(30);

		renderHook(() => useEditorKeyboard());

		fireKey("ArrowRight", { shiftKey: true });
		expect(usePlaybackStore.getState().currentTime).toBe(15);
	});

	it("Home으로 처음으로 이동한다", () => {
		usePlaybackStore.getState().seek(10);
		usePlaybackStore.getState().setDuration(30);

		renderHook(() => useEditorKeyboard());

		fireKey("Home");
		expect(usePlaybackStore.getState().currentTime).toBe(0);
	});

	it("End로 끝으로 이동한다", () => {
		usePlaybackStore.getState().setDuration(30);
		usePlaybackStore.getState().seek(10);

		renderHook(() => useEditorKeyboard());

		fireKey("End");
		expect(usePlaybackStore.getState().currentTime).toBe(30);
	});

	it("Cmd+=로 줌 인한다", () => {
		const before = useZoomStore.getState().zoom;
		renderHook(() => useEditorKeyboard());

		fireKey("Equal", { metaKey: true });
		expect(useZoomStore.getState().zoom).toBeGreaterThan(before);
	});

	it("Cmd+-로 줌 아웃한다", () => {
		const before = useZoomStore.getState().zoom;
		renderHook(() => useEditorKeyboard());

		fireKey("Minus", { metaKey: true });
		expect(useZoomStore.getState().zoom).toBeLessThan(before);
	});

	it("Cmd+0으로 줌을 초기화한다", () => {
		useZoomStore.getState().setZoom(200);
		renderHook(() => useEditorKeyboard());

		fireKey("Digit0", { metaKey: true });
		expect(useZoomStore.getState().zoom).toBe(60);
	});

	it("? 키로 단축키 도움말을 토글한다", () => {
		renderHook(() => useEditorKeyboard());

		fireKey("Slash", { shiftKey: true });
		expect(useUIStore.getState().showShortcutHelp).toBe(true);

		fireKey("Slash", { shiftKey: true });
		expect(useUIStore.getState().showShortcutHelp).toBe(false);
	});
});
