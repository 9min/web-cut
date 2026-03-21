import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrackRow } from "@/components/timeline/TrackRow";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { createTestClip, createTestTrack } from "../../factories/timelineFactory";

describe("TrackRow", () => {
	beforeEach(() => {
		usePlaybackStore.getState().reset();
	});

	it("트랙 이름을 렌더링한다", () => {
		const track = createTestTrack({ name: "비디오 1" });
		render(<TrackRow track={track} zoom={100} selectedClipId={null} onSelectClip={vi.fn()} />);
		expect(screen.getByText("비디오 1")).toBeInTheDocument();
	});

	it("트랙의 클립을 렌더링한다", () => {
		const track = createTestTrack({
			clips: [createTestClip({ name: "클립 A" })],
		});
		render(<TrackRow track={track} zoom={100} selectedClipId={null} onSelectClip={vi.fn()} />);
		expect(screen.getByText("클립 A")).toBeInTheDocument();
	});

	it("빈 트랙을 렌더링한다", () => {
		const track = createTestTrack({ clips: [] });
		render(<TrackRow track={track} zoom={100} selectedClipId={null} onSelectClip={vi.fn()} />);
		expect(screen.getByTestId("track-row")).toBeInTheDocument();
	});

	it("텍스트 트랙에 '+' 버튼이 렌더링된다", () => {
		const track = createTestTrack({ type: "text" });
		const onAddTextClip = vi.fn();
		render(
			<TrackRow
				track={track}
				zoom={100}
				selectedClipId={null}
				onSelectClip={vi.fn()}
				onAddTextClip={onAddTextClip}
			/>,
		);
		expect(screen.getByTestId("add-text-clip-button")).toBeInTheDocument();
	});

	it("비디오 트랙에는 '+' 버튼이 렌더링되지 않는다", () => {
		const track = createTestTrack({ type: "video" });
		render(
			<TrackRow
				track={track}
				zoom={100}
				selectedClipId={null}
				onSelectClip={vi.fn()}
				onAddTextClip={vi.fn()}
			/>,
		);
		expect(screen.queryByTestId("add-text-clip-button")).not.toBeInTheDocument();
	});

	it("'+' 버튼 클릭 시 onAddTextClip 콜백이 호출된다", async () => {
		const user = userEvent.setup();
		const track = createTestTrack({ id: "text-track-1", type: "text" });
		const onAddTextClip = vi.fn();
		usePlaybackStore.getState().seek(2.5);
		render(
			<TrackRow
				track={track}
				zoom={100}
				selectedClipId={null}
				onSelectClip={vi.fn()}
				onAddTextClip={onAddTextClip}
			/>,
		);

		await user.click(screen.getByTestId("add-text-clip-button"));
		expect(onAddTextClip).toHaveBeenCalledWith("text-track-1", 2.5);
	});

	it("onRemoveTrack이 전달되면 삭제 버튼이 렌더링된다", () => {
		const track = createTestTrack({ id: "track-1" });
		render(
			<TrackRow
				track={track}
				zoom={100}
				selectedClipId={null}
				onSelectClip={vi.fn()}
				onRemoveTrack={vi.fn()}
			/>,
		);
		expect(screen.getByTestId("remove-track-button")).toBeInTheDocument();
	});

	it("삭제 버튼 클릭 시 onRemoveTrack 콜백이 호출된다", async () => {
		const user = userEvent.setup();
		const track = createTestTrack({ id: "track-1" });
		const onRemoveTrack = vi.fn();
		render(
			<TrackRow
				track={track}
				zoom={100}
				selectedClipId={null}
				onSelectClip={vi.fn()}
				onRemoveTrack={onRemoveTrack}
			/>,
		);

		await user.click(screen.getByTestId("remove-track-button"));
		expect(onRemoveTrack).toHaveBeenCalledWith("track-1");
	});
});
