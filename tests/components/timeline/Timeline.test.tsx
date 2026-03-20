import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Timeline } from "@/components/timeline/Timeline";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { createTestTrack } from "../../factories/timelineFactory";

describe("Timeline", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
		usePlaybackStore.getState().reset();
	});

	it("타임라인을 렌더링한다", () => {
		render(<Timeline />);
		expect(screen.getByTestId("timeline")).toBeInTheDocument();
	});

	it("트랙이 없으면 빈 상태 메시지를 표시한다", () => {
		render(<Timeline />);
		expect(screen.getByText(/트랙을 추가/)).toBeInTheDocument();
	});

	it("트랙이 있으면 트랙 목록을 표시한다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ name: "비디오 1" }));
		render(<Timeline />);
		expect(screen.getByText("비디오 1")).toBeInTheDocument();
	});

	it("재생 컨트롤을 표시한다", () => {
		render(<Timeline />);
		expect(screen.getByRole("button", { name: /재생/ })).toBeInTheDocument();
	});

	it("타임라인 도구 모음을 표시한다", () => {
		render(<Timeline />);
		expect(screen.getByRole("button", { name: /트랙 추가/ })).toBeInTheDocument();
	});
});
