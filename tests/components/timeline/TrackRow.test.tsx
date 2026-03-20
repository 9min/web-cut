import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackRow } from "@/components/timeline/TrackRow";
import { createTestClip, createTestTrack } from "../../factories/timelineFactory";

describe("TrackRow", () => {
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
});
