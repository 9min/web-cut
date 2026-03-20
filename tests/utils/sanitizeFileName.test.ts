import { describe, expect, it } from "vitest";
import { sanitizeFileName } from "@/utils/sanitizeFileName";

describe("sanitizeFileName", () => {
	it("일반 파일명을 그대로 반환한다", () => {
		expect(sanitizeFileName("video.mp4")).toBe("video.mp4");
	});

	it("HTML 태그를 제거한다", () => {
		expect(sanitizeFileName('<script>alert("xss")</script>.mp4')).toBe("alert(xss).mp4");
	});

	it("특수문자를 제거한다", () => {
		expect(sanitizeFileName('file<>:"/|?*.mp4')).toBe("file.mp4");
	});

	it("앞뒤 공백을 제거한다", () => {
		expect(sanitizeFileName("  file.mp4  ")).toBe("file.mp4");
	});

	it("빈 파일명은 기본값을 반환한다", () => {
		expect(sanitizeFileName("")).toBe("unnamed");
		expect(sanitizeFileName("   ")).toBe("unnamed");
	});

	it("연속 공백을 하나로 줄인다", () => {
		expect(sanitizeFileName("my   video   file.mp4")).toBe("my video file.mp4");
	});
});
