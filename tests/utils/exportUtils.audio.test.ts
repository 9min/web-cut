import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import { buildFFmpegArgs, getSortedAudioClips } from "@/utils/exportUtils";
import { createTestClip, createTestTrack } from "../factories/timelineFactory";

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

describe("getSortedAudioClips", () => {
	it("오디오 트랙에서 클립을 정렬하여 반환한다", () => {
		const clip1 = createTestClip({ startTime: 5 });
		const clip2 = createTestClip({ startTime: 2 });
		const audioTrack = createTestTrack({ type: "audio", clips: [clip1, clip2] });
		const videoTrack = createTestTrack({ type: "video", clips: [createTestClip()] });

		const result = getSortedAudioClips([videoTrack, audioTrack]);

		expect(result).toHaveLength(2);
		expect(result[0]?.startTime).toBe(2);
		expect(result[1]?.startTime).toBe(5);
	});

	it("오디오 트랙이 없으면 빈 배열을 반환한다", () => {
		const videoTrack = createTestTrack({ type: "video" });
		expect(getSortedAudioClips([videoTrack])).toHaveLength(0);
	});
});

describe("오디오 트랙 내보내기 통합", () => {
	it("오디오 클립이 없으면 기존 동작을 유지한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const tracks: Track[] = [makeTrack(clips)];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks);

		expect(args).toContain("-i");
		expect(args).toContain("output.mp4");
		const filterIdx = args.indexOf("-filter_complex");
		if (filterIdx >= 0) {
			expect(args[filterIdx + 1]).not.toContain("amix");
		}
	});

	it("오디오 클립 1개가 있으면 amix 필터를 포함한다", () => {
		const videoClips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["audio1", "input_audio1.mp3"],
		]);
		const tracks: Track[] = [
			makeTrack(videoClips),
			makeTrack(
				[
					makeClip({
						id: "ac1",
						trackId: "t2",
						assetId: "audio1",
						startTime: 2,
						duration: 5,
						inPoint: 0,
						outPoint: 5,
						volume: 0.8,
					}),
				],
				{ id: "t2", type: "audio" },
			),
		];
		const args = buildFFmpegArgs(videoClips, assetFileMap, 1920, 1080, tracks);

		expect(args).toContain("input_audio1.mp3");
		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("amix");
	});

	it("여러 오디오 클립이 있으면 모두 믹싱한다", () => {
		const videoClips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
			["audio1", "input_audio1.mp3"],
			["audio2", "input_audio2.mp3"],
		]);
		const tracks: Track[] = [
			makeTrack(videoClips),
			makeTrack(
				[
					makeClip({
						id: "ac1",
						trackId: "t2",
						assetId: "audio1",
						startTime: 0,
						duration: 5,
						inPoint: 0,
						outPoint: 5,
					}),
					makeClip({
						id: "ac2",
						trackId: "t2",
						assetId: "audio2",
						startTime: 5,
						duration: 3,
						inPoint: 0,
						outPoint: 3,
					}),
				],
				{ id: "t2", type: "audio" },
			),
		];
		const args = buildFFmpegArgs(videoClips, assetFileMap, 1920, 1080, tracks);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("amix");
	});

	it("볼륨 값이 FFmpeg 필터에 반영된다", () => {
		const videoClips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["audio1", "input_audio1.mp3"],
		]);
		const tracks: Track[] = [
			makeTrack(videoClips),
			makeTrack(
				[
					makeClip({
						id: "ac1",
						trackId: "t2",
						assetId: "audio1",
						startTime: 0,
						duration: 5,
						inPoint: 0,
						outPoint: 5,
						volume: 0.5,
					}),
				],
				{ id: "t2", type: "audio" },
			),
		];
		const args = buildFFmpegArgs(videoClips, assetFileMap, 1920, 1080, tracks);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("volume=0.5");
	});
});
