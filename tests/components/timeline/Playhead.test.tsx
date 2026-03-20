import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Playhead } from "@/components/timeline/Playhead";

describe("Playhead", () => {
	it("플레이헤드를 렌더링한다", () => {
		render(<Playhead position={100} />);
		expect(screen.getByTestId("playhead")).toBeInTheDocument();
	});

	it("position에 따라 위치가 결정된다", () => {
		render(<Playhead position={150} />);
		const el = screen.getByTestId("playhead");
		expect(el.style.left).toBe("150px");
	});
});
