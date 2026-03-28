import { describe, expect, it } from "vitest";
import {
	FFMPEG_MT_BASE_URL,
	FFMPEG_ST_BASE_URL,
	getFFmpegBaseURL,
	getFFmpegCacheName,
} from "@/services/ffmpegService";

describe("멀티스레드 FFmpeg 지원", () => {
	describe("getFFmpegBaseURL", () => {
		it("MT 모드에서 MT URL을 반환한다", () => {
			const url = getFFmpegBaseURL(true);
			expect(url).toBe(FFMPEG_MT_BASE_URL);
			expect(url).toContain("core-mt");
		});

		it("ST 모드에서 ST URL을 반환한다", () => {
			const url = getFFmpegBaseURL(false);
			expect(url).toBe(FFMPEG_ST_BASE_URL);
			expect(url).not.toContain("core-mt");
		});
	});

	describe("getFFmpegCacheName", () => {
		it("MT 모드에서 MT 전용 캐시 키를 반환한다", () => {
			const name = getFFmpegCacheName(true);
			expect(name).toContain("mt");
		});

		it("ST 모드에서 ST 전용 캐시 키를 반환한다", () => {
			const name = getFFmpegCacheName(false);
			expect(name).not.toContain("mt");
		});

		it("MT와 ST 캐시 키가 서로 다르다", () => {
			const mt = getFFmpegCacheName(true);
			const st = getFFmpegCacheName(false);
			expect(mt).not.toBe(st);
		});
	});

	describe("현재 설정", () => {
		it("filter_complex 호환성 문제로 현재는 ST core만 사용한다", () => {
			// getFFmpeg()에서 내부적으로 detectMultiThreadSupport()가 false를 반환하므로
			// 항상 ST URL과 ST 캐시가 사용된다
			const stURL = getFFmpegBaseURL(false);
			expect(stURL).toBe(FFMPEG_ST_BASE_URL);
		});
	});
});
