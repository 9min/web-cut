import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { DropIndicator } from "@/components/timeline/DropIndicator";

describe("DropIndicator", () => {
	it("기본적으로 display: none 스타일로 렌더링된다", () => {
		render(<DropIndicator />);
		const el = document.querySelector(".bg-blue-400");
		expect(el).toBeInTheDocument();
		expect(el).toHaveStyle({ display: "none" });
	});

	it("ref를 전달할 수 있다", () => {
		const ref = createRef<HTMLDivElement>();
		render(<DropIndicator ref={ref} />);
		expect(ref.current).toBeInstanceOf(HTMLDivElement);
	});

	it("파란색 인디케이터 스타일을 가진다", () => {
		render(<DropIndicator />);
		const el = document.querySelector(".bg-blue-400");
		expect(el).toHaveClass("bg-blue-400", "w-0.5", "pointer-events-none");
	});
});
