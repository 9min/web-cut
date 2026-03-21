import { describe, expect, it, vi } from "vitest";

vi.mock("pixi.js", () => {
	class MockTextStyle {
		fontSize = 0;
		fill = "";
		constructor(opts: Record<string, unknown> = {}) {
			Object.assign(this, opts);
		}
	}

	class MockText {
		text = "";
		style: MockTextStyle;
		anchor = { set: vi.fn() };
		x = 0;
		y = 0;
		width = 0;
		alpha = 1;
		visible = true;
		eventMode = "auto";
		cursor = "";
		destroy = vi.fn();
		on = vi.fn();
		constructor(opts: { text?: string; style?: MockTextStyle } = {}) {
			this.text = opts.text ?? "";
			this.style = opts.style ?? new MockTextStyle();
		}
	}

	return { Text: MockText, TextStyle: MockTextStyle };
});

vi.mock("@/stores/useTimelineStore", () => ({
	useTimelineStore: {
		getState: () => ({
			updateTextClipOverlay: vi.fn(),
		}),
	},
}));

import type { TextOverlay } from "@/types/textOverlay";
import type { DragContext } from "@/utils/textOverlayRenderer";
import {
	applyTextOverlay,
	clearTextOverlay,
	destroyAllTextOverlays,
} from "@/utils/textOverlayRenderer";

function makeOverlay(overrides: Partial<TextOverlay> = {}): TextOverlay {
	return {
		content: "테스트",
		x: 50,
		y: 80,
		fontSize: 36,
		fontColor: "#FFFFFF",
		opacity: 100,
		...overrides,
	};
}

function makeContainer() {
	return { addChild: vi.fn(), on: vi.fn(), off: vi.fn() } as unknown as import("pixi.js").Container;
}

function makeTextRef() {
	return { current: new Map() } as React.RefObject<Map<string, import("pixi.js").Text>>;
}

function makeDragCtxRef() {
	return { current: new Map() } as React.RefObject<Map<string, DragContext>>;
}

describe("applyTextOverlay", () => {
	it("새 Text 객체를 생성하고 container에 추가한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(container, textRef, "tc1", makeOverlay(), 1920, 1080, "t1", dragCtxRef);

		expect(textRef.current.has("tc1")).toBe(true);
		expect(container.addChild).toHaveBeenCalled();
	});

	it("기존 Text 객체를 업데이트한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(
			container,
			textRef,
			"tc1",
			makeOverlay({ content: "A" }),
			1920,
			1080,
			"t1",
			dragCtxRef,
		);
		applyTextOverlay(
			container,
			textRef,
			"tc1",
			makeOverlay({ content: "B" }),
			1920,
			1080,
			"t1",
			dragCtxRef,
		);

		const textObj = textRef.current.get("tc1");
		expect(textObj?.text).toBe("B");
		// addChild는 한 번만 호출됨
		expect(container.addChild).toHaveBeenCalledTimes(1);
	});

	it("위치를 퍼센트로 계산한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(
			container,
			textRef,
			"tc1",
			makeOverlay({ x: 50, y: 80 }),
			1920,
			1080,
			"t1",
			dragCtxRef,
		);

		const textObj = textRef.current.get("tc1");
		expect(textObj?.x).toBe(960);
		expect(textObj?.y).toBe(864);
	});

	it("불투명도를 0~1로 변환한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(
			container,
			textRef,
			"tc1",
			makeOverlay({ opacity: 50 }),
			1920,
			1080,
			"t1",
			dragCtxRef,
		);

		const textObj = textRef.current.get("tc1");
		expect(textObj?.alpha).toBe(0.5);
	});

	it("드래그 인터랙션을 등록한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(container, textRef, "tc1", makeOverlay(), 1920, 1080, "t1", dragCtxRef);

		const textObj = textRef.current.get("tc1");
		expect(textObj?.eventMode).toBe("static");
		expect(textObj?.cursor).toBe("grab");
		expect(textObj?.on).toHaveBeenCalledWith("pointerdown", expect.any(Function));
	});

	it("드래그 컨텍스트를 업데이트한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(container, textRef, "tc1", makeOverlay(), 1920, 1080, "t1", dragCtxRef);

		expect(dragCtxRef.current.get("tc1")).toEqual({ trackId: "t1", pw: 1920, ph: 1080 });
	});
});

describe("clearTextOverlay", () => {
	it("Text 객체를 숨긴다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(container, textRef, "tc1", makeOverlay(), 1920, 1080, "t1", dragCtxRef);
		clearTextOverlay(container, textRef, "tc1");

		const textObj = textRef.current.get("tc1");
		expect(textObj?.visible).toBe(false);
	});

	it("존재하지 않는 ID에 대해 에러 없이 동작한다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		expect(() => clearTextOverlay(container, textRef, "non-existent")).not.toThrow();
	});
});

describe("destroyAllTextOverlays", () => {
	it("모든 Text 객체를 destroy하고 map을 비운다", () => {
		const container = makeContainer();
		const textRef = makeTextRef();
		const dragCtxRef = makeDragCtxRef();

		applyTextOverlay(container, textRef, "tc1", makeOverlay(), 1920, 1080, "t1", dragCtxRef);
		applyTextOverlay(container, textRef, "tc2", makeOverlay(), 1920, 1080, "t1", dragCtxRef);

		destroyAllTextOverlays(textRef);

		expect(textRef.current.size).toBe(0);
	});
});
