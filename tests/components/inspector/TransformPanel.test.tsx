import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransformPanel } from "@/components/inspector/TransformPanel";
import { TRANSFORM_DEFAULTS } from "@/constants/transform";

const mockUpdateTransform = vi.fn();
const mockResetTransform = vi.fn();
const mockPushSnapshot = vi.fn();
const mockScheduleSnapshot = vi.fn();

vi.mock("@/stores/useTimelineStore", () => ({
	useTimelineStore: Object.assign(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({
				updateTransform: mockUpdateTransform,
				resetTransform: mockResetTransform,
			}),
		{
			getState: () => ({
				updateTransform: mockUpdateTransform,
				resetTransform: mockResetTransform,
			}),
			subscribe: vi.fn(),
		},
	),
}));

vi.mock("@/stores/useHistoryStore", () => ({
	useHistoryStore: {
		getState: () => ({ pushSnapshot: mockPushSnapshot }),
	},
}));

vi.mock("@/hooks/useDebouncedSnapshot", () => ({
	useDebouncedSnapshot: () => ({ scheduleSnapshot: mockScheduleSnapshot }),
}));

describe("TransformPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("트랜스폼 슬라이더들을 렌더링한다", () => {
		render(<TransformPanel trackId="track-1" clipId="clip-1" transform={TRANSFORM_DEFAULTS} />);

		expect(screen.getByTestId("transform-x")).toBeInTheDocument();
		expect(screen.getByTestId("transform-y")).toBeInTheDocument();
		expect(screen.getByTestId("transform-scaleX")).toBeInTheDocument();
		expect(screen.getByTestId("transform-scaleY")).toBeInTheDocument();
		expect(screen.getByTestId("transform-rotation")).toBeInTheDocument();
	});

	it("초기화 버튼을 렌더링한다", () => {
		render(<TransformPanel trackId="track-1" clipId="clip-1" transform={TRANSFORM_DEFAULTS} />);

		expect(screen.getByTestId("transform-reset-button")).toBeInTheDocument();
	});

	it("현재 트랜스폼 값을 표시한다", () => {
		render(
			<TransformPanel
				trackId="track-1"
				clipId="clip-1"
				transform={{ x: 30, y: 70, scaleX: 1.5, scaleY: 0.8, rotation: 45 }}
			/>,
		);

		expect(screen.getByText("30%")).toBeInTheDocument();
		expect(screen.getByText("70%")).toBeInTheDocument();
		expect(screen.getByText("1.50")).toBeInTheDocument();
		expect(screen.getByText("0.80")).toBeInTheDocument();
		expect(screen.getByText("45°")).toBeInTheDocument();
	});

	it("슬라이더 변경 시 handleChange가 호출된다", () => {
		render(<TransformPanel trackId="track-1" clipId="clip-1" transform={TRANSFORM_DEFAULTS} />);

		const slider = screen.getByTestId("transform-x");
		fireEvent.change(slider, { target: { value: "30" } });

		expect(mockUpdateTransform).toHaveBeenCalledWith("track-1", "clip-1", { x: 30 });
		expect(mockScheduleSnapshot).toHaveBeenCalled();
	});

	it("초기화 버튼 클릭 시 resetTransform을 호출한다", async () => {
		render(
			<TransformPanel
				trackId="track-1"
				clipId="clip-1"
				transform={{ x: 30, y: 70, scaleX: 1.5, scaleY: 0.8, rotation: 45 }}
			/>,
		);

		await userEvent.click(screen.getByTestId("transform-reset-button"));

		expect(mockPushSnapshot).toHaveBeenCalled();
		expect(mockResetTransform).toHaveBeenCalledWith("track-1", "clip-1");
	});
});
