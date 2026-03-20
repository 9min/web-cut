import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayback } from "@/hooks/usePlayback";
import { usePlaybackStore } from "@/stores/usePlaybackStore";

describe("usePlayback", () => {
	let rafCallbacks: Array<(time: number) => void> = [];
	let originalRaf: typeof requestAnimationFrame;
	let originalCaf: typeof cancelAnimationFrame;

	beforeEach(() => {
		usePlaybackStore.getState().reset();
		rafCallbacks = [];

		originalRaf = globalThis.requestAnimationFrame;
		originalCaf = globalThis.cancelAnimationFrame;

		globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});
		globalThis.cancelAnimationFrame = vi.fn();
	});

	afterEach(() => {
		globalThis.requestAnimationFrame = originalRaf;
		globalThis.cancelAnimationFrame = originalCaf;
	});

	function flushRaf(timestamp: number) {
		const cbs = [...rafCallbacks];
		rafCallbacks = [];
		for (const cb of cbs) {
			cb(timestamp);
		}
	}

	it("play 시 currentTime이 증가한다", () => {
		usePlaybackStore.getState().setDuration(10);
		renderHook(() => usePlayback());

		act(() => {
			usePlaybackStore.getState().play();
		});

		// 첫 프레임 (lastTime 초기화)
		act(() => flushRaf(1000));
		// 두 번째 프레임 (1초 후)
		act(() => flushRaf(2000));

		expect(usePlaybackStore.getState().currentTime).toBeGreaterThan(0);
	});

	it("pause 시 시간이 멈춘다", () => {
		usePlaybackStore.getState().setDuration(10);
		renderHook(() => usePlayback());

		act(() => {
			usePlaybackStore.getState().play();
		});
		act(() => flushRaf(1000));
		act(() => flushRaf(2000));

		const timeBeforePause = usePlaybackStore.getState().currentTime;

		act(() => {
			usePlaybackStore.getState().pause();
		});

		// pause 후 rAF가 호출되더라도 시간이 변하지 않아야 한다
		act(() => flushRaf(3000));

		expect(usePlaybackStore.getState().currentTime).toBe(timeBeforePause);
	});

	it("duration 도달 시 자동 정지한다", () => {
		usePlaybackStore.getState().setDuration(0.5);
		renderHook(() => usePlayback());

		act(() => {
			usePlaybackStore.getState().play();
		});

		act(() => flushRaf(1000));
		// 1초 후 -> 0.5초 duration을 초과
		act(() => flushRaf(2000));

		expect(usePlaybackStore.getState().isPlaying).toBe(false);
		expect(usePlaybackStore.getState().currentTime).toBe(0.5);
	});
});
