import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "@/components/layout/Header";

describe("Header", () => {
	it("브랜드명을 표시한다", () => {
		render(<Header />);
		expect(screen.getByText("WebCut")).toBeInTheDocument();
	});

	it("프로젝트 이름을 표시한다", () => {
		render(<Header />);
		expect(screen.getByText("새 프로젝트")).toBeInTheDocument();
	});
});
