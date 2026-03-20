import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE } from "@/constants/media";
import { validateMediaFile } from "@/utils/validateMediaFile";

function createMockFile(name: string, size: number, type: string): File {
	const file = new File([""], name, { type });
	Object.defineProperty(file, "size", { value: size });
	return file;
}

describe("validateMediaFile", () => {
	it("유효한 비디오 파일을 통과시킨다", () => {
		const file = createMockFile("video.mp4", 1024, "video/mp4");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("유효한 오디오 파일을 통과시킨다", () => {
		const file = createMockFile("audio.mp3", 1024, "audio/mpeg");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(true);
	});

	it("유효한 이미지 파일을 통과시킨다", () => {
		const file = createMockFile("image.png", 1024, "image/png");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(true);
	});

	it("허용되지 않은 MIME 타입을 거부한다", () => {
		const file = createMockFile("doc.pdf", 1024, "application/pdf");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("지원하지 않는 파일 형식");
	});

	it("최대 파일 크기를 초과하면 거부한다", () => {
		const file = createMockFile("big.mp4", MAX_FILE_SIZE + 1, "video/mp4");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("파일 크기");
	});

	it("빈 파일을 거부한다", () => {
		const file = createMockFile("empty.mp4", 0, "video/mp4");
		const result = validateMediaFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("빈 파일");
	});
});
