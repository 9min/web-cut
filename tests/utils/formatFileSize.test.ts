import { describe, expect, it } from "vitest";
import { formatFileSize } from "@/utils/formatFileSize";

describe("formatFileSize", () => {
	it("0 바이트를 표시한다", () => {
		expect(formatFileSize(0)).toBe("0 B");
	});

	it("바이트 단위를 표시한다", () => {
		expect(formatFileSize(500)).toBe("500 B");
	});

	it("KB 단위를 표시한다", () => {
		expect(formatFileSize(1024)).toBe("1.0 KB");
		expect(formatFileSize(1536)).toBe("1.5 KB");
	});

	it("MB 단위를 표시한다", () => {
		expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
		expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
	});

	it("GB 단위를 표시한다", () => {
		expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.0 GB");
		expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
	});
});
