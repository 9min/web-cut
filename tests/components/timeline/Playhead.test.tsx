import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Playhead } from "@/components/timeline/Playhead";
import { usePlaybackStore } from "@/stores/usePlaybackStore";

describe("Playhead", () => {
	beforeEach(() => {
		usePlaybackStore.getState().reset();
	});

	it("플레이헤드를 렌더링한다", () => {
		render(<Playhead zoom={100} />);
		expect(screen.getByTestId("playhead")).toBeInTheDocument();
	});

	it("currentTime과 zoom에 따라 위치가 결정된다", () => {
		usePlaybackStore.getState().seek(1.5);
		render(<Playhead zoom={100} />);
		const el = screen.getByTestId("playhead");
		expect(el.style.left).toBe("150px");
	});
});
