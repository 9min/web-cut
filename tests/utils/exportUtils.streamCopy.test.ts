import { describe, expect, it } from "vitest";
import type { EncoderOptions } from "@/types/exportSettings";
import type { Clip, Track } from "@/types/timeline";
import { buildFFmpegArgs, canUseStreamCopy } from "@/utils/exportUtils";

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

describe("canUseStreamCopy", () => {
	it("FFmpeg.wasm 환경에서는 항상 false를 반환한다", () => {
		const clips = [makeClip()];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});
});

describe("buildFFmpegArgs 스트림 복사 모드", () => {
	it("streamCopy=true를 전달해도 단일 클립에서 -c copy를 사용한다 (내부 빌더 테스트)", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 2, outPoint: 8 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const encoder = makeEncoder();
		const tracks = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks, encoder, true);

		expect(args).toContain("-c");
		expect(args).toContain("copy");
	});

	it("streamCopy가 false이면 기존 인코딩 경로를 사용한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const encoder = makeEncoder();
		const tracks = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks, encoder, false);

		expect(args).toContain("-c:v");
		expect(args).toContain("libx264");
	});
});
