import { beforeEach, describe, expect, it } from "vitest";
import { usePlaybackStore } from "@/stores/usePlaybackStore";

describe("usePlaybackStore", () => {
	beforeEach(() => {
		usePlaybackStore.getState().reset();
	});

	it("초기 상태를 가진다", () => {
		const state = usePlaybackStore.getState();
		expect(state.currentTime).toBe(0);
		expect(state.isPlaying).toBe(false);
		expect(state.duration).toBe(0);
	});

	it("play로 재생 상태가 된다", () => {
		usePlaybackStore.getState().play();
		expect(usePlaybackStore.getState().isPlaying).toBe(true);
	});

	it("pause로 정지 상태가 된다", () => {
		usePlaybackStore.getState().play();
		usePlaybackStore.getState().pause();
		expect(usePlaybackStore.getState().isPlaying).toBe(false);
	});

	it("togglePlayback으로 재생 상태를 토글한다", () => {
		usePlaybackStore.getState().togglePlayback();
		expect(usePlaybackStore.getState().isPlaying).toBe(true);

		usePlaybackStore.getState().togglePlayback();
		expect(usePlaybackStore.getState().isPlaying).toBe(false);
	});

	it("seek으로 현재 시간을 설정한다", () => {
		usePlaybackStore.getState().setDuration(10);
		usePlaybackStore.getState().seek(5);
		expect(usePlaybackStore.getState().currentTime).toBe(5);
	});

	it("seek에서 음수는 0으로 클램핑한다", () => {
		usePlaybackStore.getState().seek(-5);
		expect(usePlaybackStore.getState().currentTime).toBe(0);
	});

	it("seek에서 duration 초과는 duration으로 클램핑한다", () => {
		usePlaybackStore.getState().setDuration(10);
		usePlaybackStore.getState().seek(15);
		expect(usePlaybackStore.getState().currentTime).toBe(10);
	});

	it("setDuration으로 총 길이를 설정한다", () => {
		usePlaybackStore.getState().setDuration(60);
		expect(usePlaybackStore.getState().duration).toBe(60);
	});

	it("reset으로 모든 상태를 초기화한다", () => {
		usePlaybackStore.getState().play();
		usePlaybackStore.getState().seek(5);
		usePlaybackStore.getState().setDuration(60);
		usePlaybackStore.getState().reset();

		const state = usePlaybackStore.getState();
		expect(state.currentTime).toBe(0);
		expect(state.isPlaying).toBe(false);
		expect(state.duration).toBe(0);
	});
});
