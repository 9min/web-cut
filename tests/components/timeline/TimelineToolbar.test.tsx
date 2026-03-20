import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimelineToolbar } from "@/components/timeline/TimelineToolbar";

describe("TimelineToolbar", () => {
	it("트랙 추가 버튼을 렌더링한다", () => {
		render(
			<TimelineToolbar onAddTrack={vi.fn()} onZoomIn={vi.fn()} onZoomOut={vi.fn()} zoom={100} />,
		);
		expect(screen.getByRole("button", { name: /트랙 추가/ })).toBeInTheDocument();
	});

	it("줌 인/아웃 버튼을 렌더링한다", () => {
		render(
			<TimelineToolbar onAddTrack={vi.fn()} onZoomIn={vi.fn()} onZoomOut={vi.fn()} zoom={100} />,
		);
		expect(screen.getByRole("button", { name: /확대/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /축소/ })).toBeInTheDocument();
	});

	it("트랙 추가 버튼 클릭 시 onAddTrack을 호출한다", async () => {
		const onAddTrack = vi.fn();
		render(
			<TimelineToolbar onAddTrack={onAddTrack} onZoomIn={vi.fn()} onZoomOut={vi.fn()} zoom={100} />,
		);
		await userEvent.click(screen.getByRole("button", { name: /트랙 추가/ }));
		expect(onAddTrack).toHaveBeenCalled();
	});
});
