import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useMediaStore } from "@/stores/useMediaStore";
import { createMockFile } from "../factories/mediaFactory";

vi.mock("@/utils/extractMetadata", () => ({
	extractMetadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080, duration: 60, fps: 30 }),
}));

vi.mock("@/utils/generateId", () => ({
	generateId: vi.fn().mockReturnValue("test-id-123"),
}));

describe("useMediaUpload", () => {
	beforeEach(() => {
		useMediaStore.getState().reset();
		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/mock-url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
	});

	it("유효한 파일을 업로드하면 스토어에 에셋이 추가된다", async () => {
		const { result } = renderHook(() => useMediaUpload());
		const file = createMockFile("video.mp4", 1024, "video/mp4");

		await act(async () => {
			await result.current.uploadFiles([file]);
		});

		const assets = useMediaStore.getState().assets;
		expect(assets).toHaveLength(1);
		expect(assets[0]?.name).toBe("video.mp4");
		expect(assets[0]?.status).toBe("ready");
	});

	it("유효하지 않은 파일은 에러 목록에 추가된다", async () => {
		const { result } = renderHook(() => useMediaUpload());
		const file = createMockFile("doc.pdf", 1024, "application/pdf");

		await act(async () => {
			await result.current.uploadFiles([file]);
		});

		expect(useMediaStore.getState().assets).toHaveLength(0);
		expect(result.current.errors).toHaveLength(1);
		expect(result.current.errors[0]?.message).toContain("doc.pdf");
	});

	it("여러 파일을 업로드할 수 있다", async () => {
		let callCount = 0;
		const { generateId } = await import("@/utils/generateId");
		vi.mocked(generateId).mockImplementation(() => {
			callCount++;
			return `test-id-${callCount}`;
		});

		const { result } = renderHook(() => useMediaUpload());
		const files = [
			createMockFile("video1.mp4", 1024, "video/mp4"),
			createMockFile("video2.mp4", 2048, "video/mp4"),
		];

		await act(async () => {
			await result.current.uploadFiles(files);
		});

		expect(useMediaStore.getState().assets).toHaveLength(2);
	});

	it("에러를 초기화할 수 있다", async () => {
		const { result } = renderHook(() => useMediaUpload());
		const file = createMockFile("doc.pdf", 1024, "application/pdf");

		await act(async () => {
			await result.current.uploadFiles([file]);
		});

		expect(result.current.errors).toHaveLength(1);

		act(() => {
			result.current.clearErrors();
		});

		expect(result.current.errors).toHaveLength(0);
	});
});
