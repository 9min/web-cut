import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { FilterPanel } from "@/components/inspector/FilterPanel";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { ClipFilter } from "@/types/filter";

const DEFAULT_FILTER: ClipFilter = { brightness: 0, contrast: 0, saturation: 0 };

describe("FilterPanel", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("3개의 필터 슬라이더를 렌더링한다", () => {
		render(<FilterPanel trackId="t1" clipId="c1" filter={DEFAULT_FILTER} />);

		expect(screen.getByTestId("filter-slider-brightness")).toBeInTheDocument();
		expect(screen.getByTestId("filter-slider-contrast")).toBeInTheDocument();
		expect(screen.getByTestId("filter-slider-saturation")).toBeInTheDocument();
	});

	it("필터 레이블이 한국어로 표시된다", () => {
		render(<FilterPanel trackId="t1" clipId="c1" filter={DEFAULT_FILTER} />);

		expect(screen.getByText("밝기")).toBeInTheDocument();
		expect(screen.getByText("대비")).toBeInTheDocument();
		expect(screen.getByText("채도")).toBeInTheDocument();
	});

	it("초기화 버튼이 렌더링된다", () => {
		render(<FilterPanel trackId="t1" clipId="c1" filter={DEFAULT_FILTER} />);

		expect(screen.getByTestId("filter-reset-button")).toBeInTheDocument();
		expect(screen.getByText("초기화")).toBeInTheDocument();
	});

	it("현재 필터 값이 표시된다", () => {
		const filter: ClipFilter = { brightness: 50, contrast: -30, saturation: 10 };
		render(<FilterPanel trackId="t1" clipId="c1" filter={filter} />);

		expect(screen.getByText("50")).toBeInTheDocument();
		expect(screen.getByText("-30")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("초기화 버튼 클릭 시 resetFilter를 호출한다", async () => {
		const user = userEvent.setup();

		useTimelineStore.setState({
			tracks: [
				{
					id: "t1",
					name: "비디오 1",
					type: "video",
					clips: [
						{
							id: "c1",
							trackId: "t1",
							assetId: "a1",
							name: "테스트",
							startTime: 0,
							duration: 10,
							inPoint: 0,
							outPoint: 10,
							filter: { brightness: 50, contrast: 0, saturation: 0 },
						},
					],
					textClips: [],
					muted: false,
					locked: false,
					order: 0,
				},
			],
		});

		render(
			<FilterPanel
				trackId="t1"
				clipId="c1"
				filter={{ brightness: 50, contrast: 0, saturation: 0 }}
			/>,
		);

		await user.click(screen.getByTestId("filter-reset-button"));

		const clip = useTimelineStore.getState().tracks[0]?.clips[0];
		expect(clip?.filter).toBeUndefined();
	});
});
