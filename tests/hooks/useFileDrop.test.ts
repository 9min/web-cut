import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFileDrop } from "@/hooks/useFileDrop";

describe("useFileDrop", () => {
	function createDragEvent(type: string, files: File[] = []): React.DragEvent {
		return {
			type,
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			dataTransfer: { files },
		} as unknown as React.DragEvent;
	}

	it("초기 상태에서 isDragOver는 false이다", () => {
		const { result } = renderHook(() => useFileDrop(vi.fn()));
		expect(result.current.isDragOver).toBe(false);
	});

	it("dragEnter 시 isDragOver가 true가 된다", () => {
		const { result } = renderHook(() => useFileDrop(vi.fn()));

		act(() => {
			result.current.handlers.onDragEnter(createDragEvent("dragenter"));
		});

		expect(result.current.isDragOver).toBe(true);
	});

	it("dragLeave 시 isDragOver가 false가 된다", () => {
		const { result } = renderHook(() => useFileDrop(vi.fn()));

		act(() => {
			result.current.handlers.onDragEnter(createDragEvent("dragenter"));
		});
		act(() => {
			result.current.handlers.onDragLeave(createDragEvent("dragleave"));
		});

		expect(result.current.isDragOver).toBe(false);
	});

	it("drop 시 파일을 콜백으로 전달하고 isDragOver를 false로 설정한다", () => {
		const onDrop = vi.fn();
		const { result } = renderHook(() => useFileDrop(onDrop));

		const files = [new File([""], "test.mp4", { type: "video/mp4" })];

		act(() => {
			result.current.handlers.onDragEnter(createDragEvent("dragenter"));
		});
		act(() => {
			result.current.handlers.onDrop(createDragEvent("drop", files));
		});

		expect(result.current.isDragOver).toBe(false);
		expect(onDrop).toHaveBeenCalledWith(files);
	});

	it("dragOver 이벤트의 기본 동작을 방지한다", () => {
		const { result } = renderHook(() => useFileDrop(vi.fn()));
		const event = createDragEvent("dragover");

		act(() => {
			result.current.handlers.onDragOver(event);
		});

		expect(event.preventDefault).toHaveBeenCalled();
	});
});
