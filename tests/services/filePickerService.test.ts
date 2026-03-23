import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	fallbackDownload,
	saveFile,
	saveFileWithPicker,
	supportsFilePicker,
} from "@/services/filePickerService";

describe("filePickerService", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("supportsFilePicker", () => {
		it("showSaveFilePicker가 존재하면 true를 반환한다", () => {
			vi.stubGlobal("showSaveFilePicker", vi.fn());
			expect(supportsFilePicker()).toBe(true);
			vi.unstubAllGlobals();
		});

		it("showSaveFilePicker가 없으면 false를 반환한다", () => {
			const original = window.showSaveFilePicker;
			// biome-ignore lint/performance/noDelete: 테스트를 위해 속성 삭제 필요
			delete (window as Record<string, unknown>).showSaveFilePicker;
			expect(supportsFilePicker()).toBe(false);
			if (original) {
				vi.stubGlobal("showSaveFilePicker", original);
			}
		});
	});

	describe("fallbackDownload", () => {
		it("a 태그를 생성하고 클릭하여 다운로드한다", () => {
			vi.useFakeTimers();
			const clickSpy = vi.fn();
			const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue({
				set href(_: string) {},
				set download(_: string) {},
				click: clickSpy,
			} as unknown as HTMLAnchorElement);
			const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
			vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

			const blob = new Blob(["test"], { type: "text/plain" });
			fallbackDownload(blob, "test.txt");

			expect(createElementSpy).toHaveBeenCalledWith("a");
			expect(clickSpy).toHaveBeenCalled();

			// revokeObjectURL은 다운로드 시간 확보를 위해 지연 호출된다
			expect(revokeObjectURLSpy).not.toHaveBeenCalled();
			vi.advanceTimersByTime(60_000);
			expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test");
			vi.useRealTimers();
		});
	});

	describe("saveFileWithPicker", () => {
		it("사용자 취소(AbortError) 시 false를 반환한다", async () => {
			const abortError = new DOMException("취소됨", "AbortError");
			vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(abortError));

			const blob = new Blob(["test"]);
			const result = await saveFileWithPicker(blob, "test.txt", []);

			expect(result).toBe(false);
			vi.unstubAllGlobals();
		});

		it("성공 시 true를 반환한다", async () => {
			const writeSpy = vi.fn().mockResolvedValue(undefined);
			const closeSpy = vi.fn().mockResolvedValue(undefined);
			const mockHandle = {
				createWritable: vi.fn().mockResolvedValue({
					write: writeSpy,
					close: closeSpy,
				}),
			};
			vi.stubGlobal("showSaveFilePicker", vi.fn().mockResolvedValue(mockHandle));

			const blob = new Blob(["test"]);
			const result = await saveFileWithPicker(blob, "test.txt", []);

			expect(result).toBe(true);
			expect(writeSpy).toHaveBeenCalledWith(blob);
			expect(closeSpy).toHaveBeenCalled();
			vi.unstubAllGlobals();
		});

		it("AbortError가 아닌 에러는 다시 던진다", async () => {
			vi.stubGlobal("showSaveFilePicker", vi.fn().mockRejectedValue(new Error("알 수 없는 오류")));

			const blob = new Blob(["test"]);
			await expect(saveFileWithPicker(blob, "test.txt", [])).rejects.toThrow("알 수 없는 오류");
			vi.unstubAllGlobals();
		});
	});

	describe("saveFile", () => {
		it("미지원 환경에서 fallbackDownload를 호출한다", async () => {
			const original = window.showSaveFilePicker;
			// biome-ignore lint/performance/noDelete: 테스트를 위해 속성 삭제 필요
			delete (window as Record<string, unknown>).showSaveFilePicker;

			const clickSpy = vi.fn();
			vi.spyOn(document, "createElement").mockReturnValue({
				set href(_: string) {},
				set download(_: string) {},
				click: clickSpy,
			} as unknown as HTMLAnchorElement);
			vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
			vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

			const blob = new Blob(["test"]);
			const result = await saveFile(blob, "test.txt", []);

			expect(clickSpy).toHaveBeenCalled();
			expect(result).toBe(true);

			if (original) {
				vi.stubGlobal("showSaveFilePicker", original);
			}
		});

		it("지원 환경에서 saveFileWithPicker를 호출한다", async () => {
			const writeSpy = vi.fn().mockResolvedValue(undefined);
			const closeSpy = vi.fn().mockResolvedValue(undefined);
			const mockHandle = {
				createWritable: vi.fn().mockResolvedValue({
					write: writeSpy,
					close: closeSpy,
				}),
			};
			vi.stubGlobal("showSaveFilePicker", vi.fn().mockResolvedValue(mockHandle));

			const blob = new Blob(["test"]);
			const result = await saveFile(blob, "test.txt", []);

			expect(result).toBe(true);
			expect(writeSpy).toHaveBeenCalledWith(blob);
			vi.unstubAllGlobals();
		});
	});
});
