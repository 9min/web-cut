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

	it("초기 상태에 기본 트랙이 표시된다", () => {
		render(<Timeline />);
		expect(screen.getByText("타임라인 1")).toBeInTheDocument();
	});

	it("트랙을 추가하면 목록에 표시된다", () => {
		useTimelineStore.getState().addTrack(createTestTrack({ name: "오디오 1" }));
		render(<Timeline />);
		expect(screen.getByText("오디오 1")).toBeInTheDocument();
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
