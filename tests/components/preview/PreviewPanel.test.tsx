import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { useTimelineStore } from "@/stores/useTimelineStore";

vi.mock("@/hooks/usePixiApp", () => ({
	usePixiApp: () => ({ app: { current: null }, ready: false }),
}));

vi.mock("@/hooks/usePreviewRenderer", () => ({
	usePreviewRenderer: () => {},
}));

describe("PreviewPanel", () => {
	beforeEach(() => {
		useTimelineStore.getState().reset();
	});

	it("프리뷰 패널을 렌더링한다", () => {
		render(<PreviewPanel />);
		expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
	});

	it("클립이 없으면 빈 상태 메시지를 표시한다", () => {
		render(<PreviewPanel />);
		expect(screen.getByText(/미디어를 타임라인에 배치/)).toBeInTheDocument();
	});

	it("해상도 정보를 표시한다", () => {
		render(<PreviewPanel />);
		expect(screen.getByText("1920x1080")).toBeInTheDocument();
	});
});
