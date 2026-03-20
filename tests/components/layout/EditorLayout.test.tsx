import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorLayout } from "@/components/layout/EditorLayout";

describe("EditorLayout", () => {
	it("4개의 영역을 렌더링한다", () => {
		render(
			<EditorLayout
				header={<div data-testid="header">헤더</div>}
				sidebar={<div data-testid="sidebar">사이드바</div>}
				preview={<div data-testid="preview">프리뷰</div>}
				timeline={<div data-testid="timeline">타임라인</div>}
			/>,
		);

		expect(screen.getByTestId("header")).toBeInTheDocument();
		expect(screen.getByTestId("sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("preview")).toBeInTheDocument();
		expect(screen.getByTestId("timeline")).toBeInTheDocument();
	});
});
