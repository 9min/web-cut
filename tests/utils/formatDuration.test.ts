import { describe, expect, it } from "vitest";
import { formatDuration } from "@/utils/formatDuration";

describe("formatDuration", () => {
	it("0초를 표시한다", () => {
		expect(formatDuration(0)).toBe("00:00");
	});

	it("초 단위를 표시한다", () => {
		expect(formatDuration(5)).toBe("00:05");
	});

	it("분:초 형식을 표시한다", () => {
		expect(formatDuration(65)).toBe("01:05");
	});

	it("시:분:초 형식을 표시한다", () => {
		expect(formatDuration(3661)).toBe("1:01:01");
	});

	it("소수점 이하를 버린다", () => {
		expect(formatDuration(5.7)).toBe("00:05");
	});
});
