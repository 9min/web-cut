import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import { buildFFmpegArgs, getSortedVideoClips } from "@/utils/exportUtils";

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
		muted: false,
		locked: false,
		order: 0,
		...overrides,
	};
}

describe("getSortedVideoClips", () => {
	it("비디오 트랙의 클립을 startTime 순으로 정렬한다", () => {
		const tracks = [
			makeTrack([makeClip({ id: "c2", startTime: 5 }), makeClip({ id: "c1", startTime: 0 })]),
		];
		const result = getSortedVideoClips(tracks);
		expect(result[0]?.id).toBe("c1");
		expect(result[1]?.id).toBe("c2");
	});

	it("오디오 트랙은 제외한다", () => {
		const tracks = [
			makeTrack([makeClip()], { type: "video" }),
			makeTrack([makeClip({ id: "audio-clip" })], { id: "t2", type: "audio" }),
		];
		const result = getSortedVideoClips(tracks);
		expect(result).toHaveLength(1);
	});
});

describe("buildFFmpegArgs", () => {
	it("단일 클립의 FFmpeg 인자를 생성한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		expect(args).toContain("-i");
		expect(args).toContain("input_a1.mp4");
		expect(args).toContain("output.mp4");
	});

	it("여러 클립의 FFmpeg concat 인자를 생성한다", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 2, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 3, inPoint: 0, outPoint: 3 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1280, 720);

		// 여러 입력 파일
		const inputCount = args.filter((a) => a === "-i").length;
		expect(inputCount).toBe(2);
		// 해상도 지정
		expect(args.some((a) => a.includes("1280") && a.includes("720"))).toBe(true);
	});

	it("빈 클립 배열이면 빈 인자를 반환한다", () => {
		const args = buildFFmpegArgs([], new Map(), 1920, 1080);
		expect(args).toHaveLength(0);
	});

	it("트랜지션이 있으면 xfade 필터를 사용한다", () => {
		const clips = [
			makeClip({
				id: "c1",
				assetId: "a1",
				startTime: 0,
				duration: 5,
				inPoint: 0,
				outPoint: 5,
				outTransition: { type: "fade", duration: 1 },
			}),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, duration: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("xfade=transition=fade:duration=1:offset=4");
		expect(filterComplex).toContain("acrossfade=d=1");
	});

	it("wipe-left 트랜지션을 wipeleft로 매핑한다", () => {
		const clips = [
			makeClip({
				id: "c1",
				assetId: "a1",
				startTime: 0,
				duration: 5,
				inPoint: 0,
				outPoint: 5,
				outTransition: { type: "wipe-left", duration: 0.5 },
			}),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, duration: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("xfade=transition=wipeleft");
	});

	it("트랜지션 없는 여러 클립은 concat을 사용한다", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("concat=n=2");
		expect(filterComplex).not.toContain("xfade");
	});
});
