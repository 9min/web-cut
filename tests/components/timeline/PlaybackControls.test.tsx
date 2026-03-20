import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PlaybackControls } from "@/components/timeline/PlaybackControls";
import { usePlaybackStore } from "@/stores/usePlaybackStore";

describe("PlaybackControls", () => {
	beforeEach(() => {
		usePlaybackStore.getState().reset();
	});

	it("재생 버튼을 표시한다", () => {
		render(<PlaybackControls />);
		expect(screen.getByRole("button", { name: /재생/ })).toBeInTheDocument();
	});

	it("재생 중이면 정지 버튼을 표시한다", () => {
		usePlaybackStore.getState().play();
		render(<PlaybackControls />);
		expect(screen.getByRole("button", { name: /정지/ })).toBeInTheDocument();
	});

	it("재생 버튼 클릭 시 재생 상태로 전환한다", async () => {
		render(<PlaybackControls />);
		await userEvent.click(screen.getByRole("button", { name: /재생/ }));
		expect(usePlaybackStore.getState().isPlaying).toBe(true);
	});

	it("현재 시간을 표시한다", () => {
		usePlaybackStore.getState().setDuration(60);
		usePlaybackStore.getState().seek(5);
		render(<PlaybackControls />);
		expect(screen.getByText("00:05")).toBeInTheDocument();
	});

	it("총 길이를 표시한다", () => {
		usePlaybackStore.getState().setDuration(65);
		render(<PlaybackControls />);
		expect(screen.getByText("01:05")).toBeInTheDocument();
	});
});
