import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

	it("모바일 사이드바 토글 버튼이 존재한다", () => {
		render(
			<EditorLayout
				header={<div>헤더</div>}
				sidebar={<div>사이드바</div>}
				preview={<div>프리뷰</div>}
				timeline={<div>타임라인</div>}
			/>,
		);

		expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument();
	});

	it("토글 버튼 클릭 시 모바일 사이드바가 열린다", async () => {
		render(
			<EditorLayout
				header={<div>헤더</div>}
				sidebar={<div data-testid="sidebar-content">사이드바</div>}
				preview={<div>프리뷰</div>}
				timeline={<div>타임라인</div>}
			/>,
		);

		await userEvent.click(screen.getByTestId("sidebar-toggle"));

		expect(screen.getByTestId("sidebar-backdrop")).toBeInTheDocument();
	});

	it("오버레이 클릭 시 모바일 사이드바가 닫힌다", async () => {
		render(
			<EditorLayout
				header={<div>헤더</div>}
				sidebar={<div>사이드바</div>}
				preview={<div>프리뷰</div>}
				timeline={<div>타임라인</div>}
			/>,
		);

		await userEvent.click(screen.getByTestId("sidebar-toggle"));
		expect(screen.getByTestId("sidebar-backdrop")).toBeInTheDocument();

		await userEvent.click(screen.getByTestId("sidebar-backdrop"));
		expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
	});

	it("inspector prop이 전달되면 inspector 영역을 렌더링한다", () => {
		render(
			<EditorLayout
				header={<div>헤더</div>}
				sidebar={<div>사이드바</div>}
				preview={<div>프리뷰</div>}
				timeline={<div>타임라인</div>}
				inspector={<div data-testid="inspector">인스펙터</div>}
			/>,
		);

		expect(screen.getByTestId("inspector")).toBeInTheDocument();
	});

	it("타임라인 리사이즈 핸들이 존재한다", () => {
		render(
			<EditorLayout
				header={<div>헤더</div>}
				sidebar={<div>사이드바</div>}
				preview={<div>프리뷰</div>}
				timeline={<div>타임라인</div>}
			/>,
		);

		expect(screen.getByTestId("timeline-resize-handle")).toBeInTheDocument();
	});
});
