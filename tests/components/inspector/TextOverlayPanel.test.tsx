import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TextOverlayPanel } from "@/components/inspector/TextOverlayPanel";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { TextOverlay } from "@/types/textOverlay";

const DEFAULT_OVERLAY: TextOverlay = {
	content: "테스트 자막",
	x: 50,
	y: 80,
	fontSize: 36,
	fontColor: "#FFFFFF",
	opacity: 100,
};

describe("TextOverlayPanel", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("텍스트 입력 영역을 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-content")).toBeInTheDocument();
	});

	it("위치 슬라이더를 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-x")).toBeInTheDocument();
		expect(screen.getByTestId("text-overlay-y")).toBeInTheDocument();
	});

	it("폰트 크기 슬라이더를 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-fontSize")).toBeInTheDocument();
	});

	it("폰트 색상 입력을 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-fontColor")).toBeInTheDocument();
	});

	it("불투명도 슬라이더를 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-opacity")).toBeInTheDocument();
	});

	it("시작 시간 입력을 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={2}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-clip-startTime")).toBeInTheDocument();
	});

	it("길이 입력을 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-clip-duration")).toBeInTheDocument();
	});

	it("삭제 버튼을 렌더링한다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByTestId("text-overlay-remove")).toBeInTheDocument();
		expect(screen.getByText("텍스트 삭제")).toBeInTheDocument();
	});

	it("현재 텍스트 값이 표시된다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		const textarea = screen.getByTestId("text-overlay-content") as HTMLTextAreaElement;
		expect(textarea.value).toBe("테스트 자막");
	});

	it("삭제 버튼 클릭 시 removeTextClip을 호출한다", async () => {
		const user = userEvent.setup();

		useTimelineStore.getState().addTextTrack();
		const trackId = useTimelineStore.getState().tracks[1]?.id as string; // tracks[0] is default video, tracks[1] is text
		useTimelineStore.setState((state) => ({
			tracks: state.tracks.map((t) =>
				t.id === trackId
					? {
							...t,
							textClips: [
								{
									id: "tc1",
									trackId,
									name: "자막",
									startTime: 0,
									duration: 3,
									overlay: { ...DEFAULT_OVERLAY },
								},
							],
						}
					: t,
			),
		}));

		render(
			<TextOverlayPanel
				trackId={trackId}
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		await user.click(screen.getByTestId("text-overlay-remove"));

		const track = useTimelineStore.getState().tracks.find((t) => t.id === trackId);
		expect(track?.textClips).toHaveLength(0);
	});

	it("한국어 레이블이 표시된다", () => {
		render(
			<TextOverlayPanel
				trackId="t1"
				textClipId="tc1"
				overlay={DEFAULT_OVERLAY}
				startTime={0}
				duration={3}
			/>,
		);
		expect(screen.getByText("텍스트 오버레이")).toBeInTheDocument();
		expect(screen.getByText("텍스트")).toBeInTheDocument();
		expect(screen.getByText("X 위치")).toBeInTheDocument();
		expect(screen.getByText("Y 위치")).toBeInTheDocument();
		expect(screen.getByText("폰트 크기")).toBeInTheDocument();
		expect(screen.getByText("폰트 색상")).toBeInTheDocument();
		expect(screen.getByText("불투명도")).toBeInTheDocument();
		expect(screen.getByText("시작 시간 (초)")).toBeInTheDocument();
		expect(screen.getByText("길이 (초)")).toBeInTheDocument();
	});
});
