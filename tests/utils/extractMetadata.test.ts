import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioMetadata, ImageMetadata, VideoMetadata } from "@/types/media";
import { extractMetadata } from "@/utils/extractMetadata";

function createMockFile(name: string, type: string): File {
	return new File([""], name, { type });
}

describe("extractMetadata", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
	});

	it("비디오 메타데이터를 추출한다", async () => {
		const mockVideo = {
			videoWidth: 1920,
			videoHeight: 1080,
			duration: 120,
			src: "",
			onloadedmetadata: null as (() => void) | null,
			onerror: null as (() => void) | null,
			load: vi.fn(),
		};

		vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
			if (tag === "video") {
				return mockVideo as unknown as HTMLElement;
			}
			return document.createElement(tag);
		});

		const file = createMockFile("video.mp4", "video/mp4");
		const promise = extractMetadata(file, "video");

		mockVideo.onloadedmetadata?.();

		const metadata = (await promise) as VideoMetadata;
		expect(metadata.width).toBe(1920);
		expect(metadata.height).toBe(1080);
		expect(metadata.duration).toBe(120);
		expect(metadata.fps).toBe(30);
	});

	it("오디오 메타데이터를 추출한다", async () => {
		const mockAudio = {
			duration: 180,
			src: "",
			onloadedmetadata: null as (() => void) | null,
			onerror: null as (() => void) | null,
			load: vi.fn(),
		};

		vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
			if (tag === "audio") {
				return mockAudio as unknown as HTMLElement;
			}
			return document.createElement(tag);
		});

		const file = createMockFile("audio.mp3", "audio/mpeg");
		const promise = extractMetadata(file, "audio");
		mockAudio.onloadedmetadata?.();

		const metadata = (await promise) as AudioMetadata;
		expect(metadata.duration).toBe(180);
	});

	it("이미지 메타데이터를 추출한다", async () => {
		const mockImage = {
			naturalWidth: 800,
			naturalHeight: 600,
			src: "",
			onload: null as (() => void) | null,
			onerror: null as (() => void) | null,
		};

		vi.spyOn(globalThis, "Image").mockImplementation(function MockImage() {
			return mockImage as unknown as HTMLImageElement;
		} as unknown as typeof Image);

		const file = createMockFile("image.png", "image/png");
		const promise = extractMetadata(file, "image");
		mockImage.onload?.();

		const metadata = (await promise) as ImageMetadata;
		expect(metadata.width).toBe(800);
		expect(metadata.height).toBe(600);
	});

	it("메타데이터 추출 실패 시 null을 반환한다", async () => {
		const mockVideo = {
			videoWidth: 0,
			videoHeight: 0,
			duration: 0,
			src: "",
			onloadedmetadata: null as (() => void) | null,
			onerror: null as ((e: unknown) => void) | null,
			load: vi.fn(),
		};

		vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
			if (tag === "video") {
				return mockVideo as unknown as HTMLElement;
			}
			return document.createElement(tag);
		});

		const file = createMockFile("bad.mp4", "video/mp4");
		const promise = extractMetadata(file, "video");
		mockVideo.onerror?.(new Error("load failed"));

		const metadata = await promise;
		expect(metadata).toBeNull();
	});

	describe("타임아웃", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("비디오 메타데이터 추출이 10초 후 타임아웃되면 null을 반환한다", async () => {
			const mockVideo = {
				videoWidth: 0,
				videoHeight: 0,
				duration: 0,
				src: "",
				onloadedmetadata: null as (() => void) | null,
				onerror: null as (() => void) | null,
				load: vi.fn(),
			};

			vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
				if (tag === "video") return mockVideo as unknown as HTMLElement;
				return document.createElement(tag);
			});

			const file = createMockFile("stuck.mp4", "video/mp4");
			const promise = extractMetadata(file, "video");

			vi.advanceTimersByTime(10_000);

			const metadata = await promise;
			expect(metadata).toBeNull();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
		});

		it("오디오 메타데이터 추출이 10초 후 타임아웃되면 null을 반환한다", async () => {
			const mockAudio = {
				duration: 0,
				src: "",
				onloadedmetadata: null as (() => void) | null,
				onerror: null as (() => void) | null,
				load: vi.fn(),
			};

			vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
				if (tag === "audio") return mockAudio as unknown as HTMLElement;
				return document.createElement(tag);
			});

			const file = createMockFile("stuck.mp3", "audio/mpeg");
			const promise = extractMetadata(file, "audio");

			vi.advanceTimersByTime(10_000);

			const metadata = await promise;
			expect(metadata).toBeNull();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
		});

		it("이미지 메타데이터 추출이 10초 후 타임아웃되면 null을 반환한다", async () => {
			const mockImage = {
				naturalWidth: 0,
				naturalHeight: 0,
				src: "",
				onload: null as (() => void) | null,
				onerror: null as (() => void) | null,
			};

			vi.spyOn(globalThis, "Image").mockImplementation(function MockImage() {
				return mockImage as unknown as HTMLImageElement;
			} as unknown as typeof Image);

			const file = createMockFile("stuck.png", "image/png");
			const promise = extractMetadata(file, "image");

			vi.advanceTimersByTime(10_000);

			const metadata = await promise;
			expect(metadata).toBeNull();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
		});
	});
});
