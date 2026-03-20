import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeRuler } from "@/components/timeline/TimeRuler";

describe("TimeRuler", () => {
	beforeEach(() => {
		// jsdom에서 pointer capture API 모킹
		Element.prototype.setPointerCapture = vi.fn();
		Element.prototype.releasePointerCapture = vi.fn();
		Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(true);
	});

	it("시간 눈금자를 렌더링한다", () => {
		render(<TimeRuler zoom={100} duration={10} onSeek={vi.fn()} scrollLeft={0} />);
		expect(screen.getByTestId("time-ruler")).toBeInTheDocument();
	});

	it("포인터 다운 시 onSeek를 호출한다", () => {
		const onSeek = vi.fn();
		render(<TimeRuler zoom={100} duration={10} onSeek={onSeek} scrollLeft={0} />);

		const ruler = screen.getByTestId("time-ruler");
		fireEvent.pointerDown(ruler, { clientX: 200, pointerId: 1 });

		expect(onSeek).toHaveBeenCalled();
	});

	it("포인터 드래그 시 onSeek가 연속 호출된다", () => {
		const onSeek = vi.fn();
		render(<TimeRuler zoom={100} duration={10} onSeek={onSeek} scrollLeft={0} />);

		const ruler = screen.getByTestId("time-ruler");
		fireEvent.pointerDown(ruler, { clientX: 100, pointerId: 1 });
		fireEvent.pointerMove(ruler, { clientX: 200, pointerId: 1 });
		fireEvent.pointerMove(ruler, { clientX: 300, pointerId: 1 });
		fireEvent.pointerUp(ruler, { pointerId: 1 });

		expect(onSeek).toHaveBeenCalledTimes(3);
	});
});
