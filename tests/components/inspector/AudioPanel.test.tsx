import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPanel } from "@/components/inspector/AudioPanel";
import { AUDIO_VOLUME_DEFAULT } from "@/constants/audio";

const mockUpdateClipVolume = vi.fn();
const mockPushSnapshot = vi.fn();
const mockScheduleSnapshot = vi.fn();

vi.mock("@/stores/useTimelineStore", () => ({
	useTimelineStore: Object.assign(
		(selector: (s: Record<string, unknown>) => unknown) =>
			selector({ updateClipVolume: mockUpdateClipVolume }),
		{
			getState: () => ({ updateClipVolume: mockUpdateClipVolume }),
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

describe("AudioPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("볼륨 슬라이더를 렌더링한다", () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.8} />);

		expect(screen.getByTestId("audio-volume-slider")).toBeInTheDocument();
		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("초기화 버튼을 렌더링한다", () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.5} />);

		expect(screen.getByTestId("audio-volume-reset")).toBeInTheDocument();
	});

	it("슬라이더 변경 시 updateClipVolume을 호출한다", () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.8} />);

		const slider = screen.getByTestId("audio-volume-slider");
		fireEvent.change(slider, { target: { value: "0.5" } });

		expect(mockUpdateClipVolume).toHaveBeenCalledWith("track-1", "clip-1", 0.5);
		expect(mockScheduleSnapshot).toHaveBeenCalled();
	});

	it("초기화 버튼 클릭 시 기본 볼륨으로 복원한다", async () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.5} />);

		await userEvent.click(screen.getByTestId("audio-volume-reset"));

		expect(mockPushSnapshot).toHaveBeenCalled();
		expect(mockUpdateClipVolume).toHaveBeenCalledWith("track-1", "clip-1", AUDIO_VOLUME_DEFAULT);
	});
});
