import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AudioClipBlock } from "@/components/timeline/AudioClipBlock";
import { createTestClip } from "../../factories/timelineFactory";

describe("AudioClipBlock", () => {
	it("오디오 클립 블록을 렌더링한다", () => {
		const clip = createTestClip({ name: "배경음악.mp3" });
		render(<AudioClipBlock clip={clip} zoom={100} isSelected={false} onSelect={vi.fn()} />);

		expect(screen.getByTestId("audio-clip-block")).toBeInTheDocument();
		expect(screen.getByText("배경음악.mp3")).toBeInTheDocument();
	});

	it("선택 시 녹색 스타일을 적용한다", () => {
		const clip = createTestClip({ name: "오디오 클립" });
		render(<AudioClipBlock clip={clip} zoom={100} isSelected={true} onSelect={vi.fn()} />);

		const block = screen.getByTestId("audio-clip-block");
		expect(block.className).toContain("bg-green-600");
	});
});
