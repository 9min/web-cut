import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { SnapIndicator } from "@/components/timeline/SnapIndicator";

describe("SnapIndicator", () => {
	it("기본적으로 display: none 스타일로 렌더링된다", () => {
		render(<SnapIndicator />);
		const el = document.querySelector(".bg-yellow-400");
		expect(el).toBeInTheDocument();
		expect(el).toHaveStyle({ display: "none" });
	});

	it("ref를 전달할 수 있다", () => {
		const ref = createRef<HTMLDivElement>();
		render(<SnapIndicator ref={ref} />);
		expect(ref.current).toBeInstanceOf(HTMLDivElement);
	});

	it("노란색 인디케이터 스타일을 가진다", () => {
		render(<SnapIndicator />);
		const el = document.querySelector(".bg-yellow-400");
		expect(el).toHaveClass("bg-yellow-400", "w-0.5", "pointer-events-none");
	});
});
