import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AudioPanel } from "@/components/inspector/AudioPanel";

describe("AudioPanel", () => {
	it("볼륨 슬라이더를 렌더링한다", () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.8} />);

		expect(screen.getByTestId("audio-volume-slider")).toBeInTheDocument();
		expect(screen.getByText("80%")).toBeInTheDocument();
	});

	it("초기화 버튼을 렌더링한다", () => {
		render(<AudioPanel trackId="track-1" clipId="clip-1" volume={0.5} />);

		expect(screen.getByTestId("audio-volume-reset")).toBeInTheDocument();
	});
});
