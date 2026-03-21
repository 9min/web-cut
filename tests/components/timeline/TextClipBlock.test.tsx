import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TextClipBlock } from "@/components/timeline/TextClipBlock";
import type { TextClip } from "@/types/textOverlay";

vi.mock("@dnd-kit/core", () => ({
	useDraggable: () => ({
		setNodeRef: vi.fn(),
		attributes: {},
		listeners: {},
		isDragging: false,
		transform: null,
	}),
}));

function makeTextClip(overrides: Partial<TextClip> = {}): TextClip {
	return {
		id: "tc-1",
		trackId: "track-1",
		name: "텍스트 1",
		startTime: 0,
		duration: 3,
		overlay: {
			content: "안녕하세요",
			x: 50,
			y: 80,
			fontSize: 36,
			fontColor: "#FFFFFF",
			opacity: 100,
		},
		...overrides,
	};
}

describe("TextClipBlock", () => {
	it("텍스트 콘텐츠를 표시한다", () => {
		render(
			<TextClipBlock
				textClip={makeTextClip()}
				zoom={100}
				isSelected={false}
				onSelect={vi.fn()}
				onResize={vi.fn()}
			/>,
		);

		expect(screen.getByText("안녕하세요")).toBeInTheDocument();
	});

	it("콘텐츠가 비어있으면 name을 표시한다", () => {
		render(
			<TextClipBlock
				textClip={makeTextClip({
					overlay: { content: "", x: 50, y: 80, fontSize: 36, fontColor: "#FFFFFF", opacity: 100 },
				})}
				zoom={100}
				isSelected={false}
				onSelect={vi.fn()}
				onResize={vi.fn()}
			/>,
		);

		expect(screen.getByText("텍스트 1")).toBeInTheDocument();
	});

	it("선택 시 강조 스타일이 적용된다", () => {
		render(
			<TextClipBlock
				textClip={makeTextClip()}
				zoom={100}
				isSelected={true}
				onSelect={vi.fn()}
				onResize={vi.fn()}
			/>,
		);

		const block = screen.getByTestId("text-clip-block");
		expect(block).toHaveClass("bg-amber-600");
		expect(block).toHaveClass("ring-2");
	});

	it("클릭 시 onSelect를 호출한다", async () => {
		const onSelect = vi.fn();
		render(
			<TextClipBlock
				textClip={makeTextClip()}
				zoom={100}
				isSelected={false}
				onSelect={onSelect}
				onResize={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByTestId("text-clip-block"));
		expect(onSelect).toHaveBeenCalledWith("tc-1");
	});

	it("리사이즈 핸들이 존재한다", () => {
		render(
			<TextClipBlock
				textClip={makeTextClip()}
				zoom={100}
				isSelected={false}
				onSelect={vi.fn()}
				onResize={vi.fn()}
			/>,
		);

		expect(screen.getByTestId("text-clip-resize-left")).toBeInTheDocument();
		expect(screen.getByTestId("text-clip-resize-right")).toBeInTheDocument();
	});
});
