import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useExportStore } from "@/stores/useExportStore";

vi.mock("@/hooks/useExport", () => ({
	useExport: () => ({
		...useExportStore.getState(),
		startExport: vi.fn(),
	}),
}));

describe("ExportPanel", () => {
	beforeEach(() => {
		useExportStore.getState().reset();
	});

	it("내보내기 버튼을 렌더링한다", () => {
		render(<ExportPanel />);
		expect(screen.getByRole("button", { name: /내보내기/ })).toBeInTheDocument();
	});

	it("해상도 선택을 표시한다", () => {
		render(<ExportPanel />);
		expect(screen.getByText("1080p")).toBeInTheDocument();
	});

	it("인코딩 중이면 진행률을 표시한다", () => {
		useExportStore.setState({ status: "encoding", progress: 45 });
		render(<ExportPanel />);
		expect(screen.getByText("45%")).toBeInTheDocument();
	});

	it("완료 상태를 표시한다", () => {
		useExportStore.setState({ status: "done" });
		render(<ExportPanel />);
		expect(screen.getByText(/완료/)).toBeInTheDocument();
	});

	it("에러 상태를 표시한다", () => {
		useExportStore.setState({ status: "error", error: "인코딩 실패" });
		render(<ExportPanel />);
		expect(screen.getByText("인코딩 실패")).toBeInTheDocument();
	});
});
