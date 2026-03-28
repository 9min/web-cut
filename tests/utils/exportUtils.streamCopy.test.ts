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
	it("필터, 트랜스폼, 트랜지션, 텍스트가 없는 단일 클립은 true를 반환한다", () => {
		const clips = [makeClip()];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(true);
	});

	it("필터가 적용된 클립은 false를 반환한다", () => {
		const clips = [makeClip({ filter: { brightness: 50, contrast: 0, saturation: 0 } })];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});

	it("필터가 기본값(0,0,0)이면 true를 반환한다", () => {
		const clips = [makeClip({ filter: { brightness: 0, contrast: 0, saturation: 0 } })];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(true);
	});

	it("트랜스폼이 적용된 클립은 false를 반환한다", () => {
		const clips = [makeClip({ transform: { x: 50, y: 50, scaleX: 1.5, scaleY: 1, rotation: 0 } })];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});

	it("트랜스폼이 기본값이면 true를 반환한다", () => {
		const clips = [makeClip({ transform: { x: 50, y: 50, scaleX: 1, scaleY: 1, rotation: 0 } })];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(true);
	});

	it("트랜지션이 있으면 false를 반환한다", () => {
		const clips = [
			makeClip({ id: "c1", outTransition: { type: "fade", duration: 1 } }),
			makeClip({ id: "c2", assetId: "a2" }),
		];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});

	it("텍스트 클립이 있으면 false를 반환한다", () => {
		const clips = [makeClip()];
		const tracks: Track[] = [
			makeTrack(clips),
			{
				id: "tt1",
				name: "텍스트",
				type: "text",
				clips: [],
				textClips: [
					{
						id: "tc1",
						trackId: "tt1",
						name: "자막",
						startTime: 0,
						duration: 3,
						overlay: {
							content: "자막",
							x: 50,
							y: 80,
							fontSize: 36,
							fontColor: "#FFF",
							opacity: 100,
						},
					},
				],
				muted: false,
				locked: false,
				order: 1,
			},
		];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});

	it("오디오 클립이 있으면 false를 반환한다 (오디오 믹싱 필요)", () => {
		const clips = [makeClip()];
		const tracks: Track[] = [
			makeTrack(clips),
			makeTrack([makeClip({ id: "ac1", trackId: "t2", assetId: "audio1" })], {
				id: "t2",
				type: "audio",
			}),
		];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});

	it("여러 클립은 false를 반환한다 (concat filter는 -c copy와 호환되지 않음)", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const tracks = [makeTrack(clips)];
		expect(canUseStreamCopy(clips, tracks)).toBe(false);
	});
});

describe("buildFFmpegArgs 스트림 복사 모드", () => {
	it("단일 클립 스트림 복사 시 -c copy를 사용한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 2, outPoint: 8 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const encoder = makeEncoder();
		const tracks = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks, encoder, true);

		expect(args).toContain("-c");
		expect(args).toContain("copy");
		expect(args).not.toContain("-c:v");
		expect(args).not.toContain("-crf");
		expect(args).not.toContain("-preset");
	});

	it("단일 클립 스트림 복사 시 -ss와 -t로 구간을 지정한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 2, outPoint: 8 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const encoder = makeEncoder();
		const tracks = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks, encoder, true);

		expect(args).toContain("-ss");
		expect(args).toContain("-t");
	});

	it("여러 클립은 streamCopy=true여도 기존 인코딩 경로를 사용한다", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const encoder = makeEncoder();
		const tracks = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks, encoder, true);

		// 여러 클립은 스트림 복사가 불가하므로 인코딩 사용
		expect(args).toContain("-c:v");
		expect(args).toContain("-filter_complex");
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
