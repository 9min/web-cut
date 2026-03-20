import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClipBlock } from "@/components/timeline/ClipBlock";
import { createTestClip } from "../../factories/timelineFactory";

describe("ClipBlock", () => {
	it("클립 이름을 렌더링한다", () => {
		const clip = createTestClip({ name: "인트로" });
		render(<ClipBlock clip={clip} zoom={100} isSelected={false} onSelect={vi.fn()} />);
		expect(screen.getByText("인트로")).toBeInTheDocument();
	});

	it("줌과 시간에 따라 너비가 계산된다", () => {
		const clip = createTestClip({ startTime: 2, duration: 3 });
		render(<ClipBlock clip={clip} zoom={100} isSelected={false} onSelect={vi.fn()} />);
		const el = screen.getByTestId("clip-block");
		expect(el.style.width).toBe("300px");
		expect(el.style.left).toBe("200px");
	});

	it("선택 상태를 표시한다", () => {
		const clip = createTestClip();
		render(<ClipBlock clip={clip} zoom={100} isSelected={true} onSelect={vi.fn()} />);
		const el = screen.getByTestId("clip-block");
		expect(el.className).toContain("ring");
	});

	it("클릭 시 onSelect를 호출한다", async () => {
		const onSelect = vi.fn();
		const clip = createTestClip({ id: "c1" });
		render(<ClipBlock clip={clip} zoom={100} isSelected={false} onSelect={onSelect} />);
		await userEvent.click(screen.getByTestId("clip-block"));
		expect(onSelect).toHaveBeenCalledWith("c1");
	});
});
