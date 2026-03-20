import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeRuler } from "@/components/timeline/TimeRuler";

describe("TimeRuler", () => {
	it("시간 눈금자를 렌더링한다", () => {
		render(<TimeRuler zoom={100} duration={10} onSeek={vi.fn()} scrollLeft={0} />);
		expect(screen.getByTestId("time-ruler")).toBeInTheDocument();
	});

	it("클릭 시 onSeek를 호출한다", () => {
		const onSeek = vi.fn();
		render(<TimeRuler zoom={100} duration={10} onSeek={onSeek} scrollLeft={0} />);

		const ruler = screen.getByTestId("time-ruler");
		fireEvent.click(ruler, { clientX: 200 });

		expect(onSeek).toHaveBeenCalled();
	});
});
