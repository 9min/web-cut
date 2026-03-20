import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimelineToolbar } from "@/components/timeline/TimelineToolbar";

const defaultProps = {
	onAddTrack: vi.fn(),
	onZoomIn: vi.fn(),
	onZoomOut: vi.fn(),
	onSplit: vi.fn(),
	onDelete: vi.fn(),
	zoom: 100,
	canSplit: false,
	canDelete: false,
};

describe("TimelineToolbar", () => {
	it("트랙 추가 버튼을 렌더링한다", () => {
		render(<TimelineToolbar {...defaultProps} />);
		expect(screen.getByRole("button", { name: /트랙 추가/ })).toBeInTheDocument();
	});

	it("줌 인/아웃 버튼을 렌더링한다", () => {
		render(<TimelineToolbar {...defaultProps} />);
		expect(screen.getByRole("button", { name: /확대/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /축소/ })).toBeInTheDocument();
	});

	it("분할/삭제 버튼을 렌더링한다", () => {
		render(<TimelineToolbar {...defaultProps} />);
		expect(screen.getByRole("button", { name: /분할/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /삭제/ })).toBeInTheDocument();
	});

	it("트랙 추가 버튼 클릭 시 onAddTrack을 호출한다", async () => {
		const onAddTrack = vi.fn();
		render(<TimelineToolbar {...defaultProps} onAddTrack={onAddTrack} />);
		await userEvent.click(screen.getByRole("button", { name: /트랙 추가/ }));
		expect(onAddTrack).toHaveBeenCalled();
	});

	it("canSplit이 false이면 분할 버튼이 비활성화된다", () => {
		render(<TimelineToolbar {...defaultProps} canSplit={false} />);
		expect(screen.getByRole("button", { name: /분할/ })).toBeDisabled();
	});

	it("canSplit이 true이면 분할 버튼 클릭 시 onSplit을 호출한다", async () => {
		const onSplit = vi.fn();
		render(<TimelineToolbar {...defaultProps} onSplit={onSplit} canSplit={true} />);
		await userEvent.click(screen.getByRole("button", { name: /분할/ }));
		expect(onSplit).toHaveBeenCalled();
	});

	it("canDelete이 true이면 삭제 버튼 클릭 시 onDelete를 호출한다", async () => {
		const onDelete = vi.fn();
		render(<TimelineToolbar {...defaultProps} onDelete={onDelete} canDelete={true} />);
		await userEvent.click(screen.getByRole("button", { name: /삭제/ }));
		expect(onDelete).toHaveBeenCalled();
	});
});
