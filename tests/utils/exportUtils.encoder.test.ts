import { describe, expect, it } from "vitest";
import type { EncoderOptions } from "@/types/exportSettings";
import type { Clip, Track } from "@/types/timeline";
import { buildFFmpegArgs } from "@/utils/exportUtils";

function makeClip(overrides: Partial<Clip> = {}): Clip {
	return {
		id: "c1",
		trackId: "t1",
		assetId: "a1",
		name: "테스트",
		startTime: 0,
		duration: 10,
		inPoint: 0,
		outPoint: 10,
		...overrides,
	};
}

function makeTrack(clips: Clip[], overrides: Partial<Track> = {}): Track {
	return {
		id: "t1",
		name: "비디오 1",
		type: "video",
		clips,
		textClips: [],
		muted: false,
		locked: false,
		order: 0,
		...overrides,
	};
}

function makeEncoder(overrides: Partial<EncoderOptions> = {}): EncoderOptions {
	return {
		codec: "libx264",
		crf: 23,
		preset: "ultrafast",
		audioCodec: "aac",
		outputFile: "output.mp4",
		...overrides,
	};
}

/** args 배열에서 특정 플래그 뒤의 값을 반환한다 */
function getArgValue(args: string[], flag: string): string | undefined {
	const idx = args.indexOf(flag);
	return idx >= 0 ? args[idx + 1] : undefined;
}

describe("인코딩 파라미터 최적화", () => {
	describe("libx264 추가 파라미터", () => {
		it("pix_fmt yuv420p를 포함한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder({ codec: "libx264" });
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-pix_fmt")).toBe("yuv420p");
		});

		it("B-프레임을 비활성화한다 (-bf 0)", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder({ codec: "libx264" });
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-bf")).toBe("0");
		});

		it("키프레임 간격을 설정한다 (-g 250)", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder({ codec: "libx264" });
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-g")).toBe("250");
		});

		it("-tune 옵션은 사용하지 않는다 (WASM 호환성)", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder({ codec: "libx264" });
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(args).not.toContain("-tune");
		});
	});

	describe("libvpx-vp9 추가 파라미터", () => {
		it("row-mt를 활성화한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.webm"]]);
			const encoder = makeEncoder({
				codec: "libvpx-vp9",
				audioCodec: "libopus",
				outputFile: "output.webm",
			});
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-row-mt")).toBe("1");
		});

		it("tile-columns를 설정한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.webm"]]);
			const encoder = makeEncoder({
				codec: "libvpx-vp9",
				audioCodec: "libopus",
				outputFile: "output.webm",
			});
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-tile-columns")).toBe("2");
		});

		it("lag-in-frames를 0으로 설정한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.webm"]]);
			const encoder = makeEncoder({
				codec: "libvpx-vp9",
				audioCodec: "libopus",
				outputFile: "output.webm",
			});
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-lag-in-frames")).toBe("0");
		});

		it("auto-alt-ref를 비활성화한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.webm"]]);
			const encoder = makeEncoder({
				codec: "libvpx-vp9",
				audioCodec: "libopus",
				outputFile: "output.webm",
			});
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-auto-alt-ref")).toBe("0");
		});

		it("aq-mode를 비활성화한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.webm"]]);
			const encoder = makeEncoder({
				codec: "libvpx-vp9",
				audioCodec: "libopus",
				outputFile: "output.webm",
			});
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-aq-mode")).toBe("0");
		});
	});

	describe("오디오 인코딩 최적화", () => {
		it("샘플레이트를 44100으로 고정한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder();
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-ar")).toBe("44100");
		});

		it("채널 수를 2(스테레오)로 고정한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder();
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-ac")).toBe("2");
		});

		it("오디오 비트레이트를 128k로 고정한다", () => {
			const clips = [makeClip()];
			const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
			const encoder = makeEncoder();
			const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, [makeTrack(clips)], encoder);

			expect(getArgValue(args, "-b:a")).toBe("128k");
		});
	});

	describe("high 품질 프리셋 변경", () => {
		it("PRESET_MAP.high가 ultrafast이다", async () => {
			const { PRESET_MAP } = await import("@/types/exportSettings");
			expect(PRESET_MAP.high).toBe("ultrafast");
		});

		it("QUALITY_CRF.mp4.high가 17이다 (품질 보상)", async () => {
			const { QUALITY_CRF } = await import("@/types/exportSettings");
			expect(QUALITY_CRF.mp4.high).toBe(17);
		});
	});
});
