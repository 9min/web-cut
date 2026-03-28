import { describe, expect, it } from "vitest";
import type { Clip, Track } from "@/types/timeline";
import {
	buildFFmpegArgs,
	buildSpeedAudioFilter,
	buildSpeedVideoFilter,
	getSortedVideoClips,
} from "@/utils/exportUtils";

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

	it("텍스트 트랙은 제외한다", () => {
		const tracks = [
			makeTrack([makeClip()], { type: "video" }),
			makeTrack([], { id: "t2", type: "text" }),
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

	it("단일 클립에 필터가 있으면 eq 필터를 포함한다", () => {
		const clips = [
			makeClip({
				assetId: "a1",
				inPoint: 0,
				outPoint: 10,
				filter: { brightness: 50, contrast: 0, saturation: 0 },
			}),
		];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const vfIndex = args.indexOf("-vf");
		const vfValue = args[vfIndex + 1] ?? "";
		expect(vfValue).toContain("eq=brightness=0.5000:contrast=1.0000:saturation=1.0000");
	});

	it("concat 모드에서 필터가 있는 클립에 eq를 추가한다", () => {
		const clips = [
			makeClip({
				id: "c1",
				assetId: "a1",
				startTime: 0,
				inPoint: 0,
				outPoint: 5,
				filter: { brightness: -50, contrast: 50, saturation: 0 },
			}),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("eq=brightness=-0.5000:contrast=1.5000:saturation=1.0000");
	});

	it("필터가 기본값이면 eq를 추가하지 않는다", () => {
		const clips = [
			makeClip({
				assetId: "a1",
				inPoint: 0,
				outPoint: 10,
				filter: { brightness: 0, contrast: 0, saturation: 0 },
			}),
		];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const vfIndex = args.indexOf("-vf");
		const vfValue = args[vfIndex + 1] ?? "";
		expect(vfValue).not.toContain("eq=");
	});

	it("독립 텍스트 클립이 있으면 단일 클립에 drawtext+enable 필터를 추가한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const tracks: Track[] = [
			makeTrack(clips),
			{
				id: "tt1",
				name: "텍스트 1",
				type: "text",
				clips: [],
				textClips: [
					{
						id: "tc1",
						trackId: "tt1",
						name: "자막",
						startTime: 2,
						duration: 3,
						overlay: {
							content: "자막",
							x: 50,
							y: 80,
							fontSize: 36,
							fontColor: "#FFFFFF",
							opacity: 100,
						},
					},
				],
				muted: false,
				locked: false,
				order: 1,
			},
		];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks);

		const vfIndex = args.indexOf("-vf");
		const vfValue = args[vfIndex + 1] ?? "";
		expect(vfValue).toContain("drawtext=");
		expect(vfValue).toContain("enable='between(t,2.000,5.000)'");
	});

	it("독립 텍스트 클립이 있으면 concat 모드에서 텍스트 필터를 체이닝한다", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const tracks: Track[] = [
			makeTrack(clips),
			{
				id: "tt1",
				name: "텍스트 1",
				type: "text",
				clips: [],
				textClips: [
					{
						id: "tc1",
						trackId: "tt1",
						name: "자막",
						startTime: 1,
						duration: 2,
						overlay: {
							content: "자막",
							x: 50,
							y: 80,
							fontSize: 24,
							fontColor: "#FF0000",
							opacity: 80,
						},
					},
				],
				muted: false,
				locked: false,
				order: 1,
			},
		];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		expect(filterComplex).toContain("drawtext=");
		expect(filterComplex).toContain("enable='between(t,1.000,3.000)'");
	});

	it("텍스트 클립 content가 빈 문자열이면 drawtext를 추가하지 않는다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const tracks: Track[] = [
			makeTrack(clips),
			{
				id: "tt1",
				name: "텍스트 1",
				type: "text",
				clips: [],
				textClips: [
					{
						id: "tc1",
						trackId: "tt1",
						name: "빈 자막",
						startTime: 0,
						duration: 3,
						overlay: {
							content: "",
							x: 50,
							y: 80,
							fontSize: 36,
							fontColor: "#FFFFFF",
							opacity: 100,
						},
					},
				],
				muted: false,
				locked: false,
				order: 1,
			},
		];
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080, tracks);

		const vfIndex = args.indexOf("-vf");
		const vfValue = args[vfIndex + 1] ?? "";
		expect(vfValue).not.toContain("drawtext=");
	});

	it("동일 에셋 2클립 + 트랜지션: 클립마다 별도 입력 인덱스를 사용한다", () => {
		const clips = [
			makeClip({
				id: "c1",
				assetId: "a1",
				startTime: 0,
				duration: 5,
				inPoint: 0,
				outPoint: 5,
				outTransition: { type: "dissolve", duration: 1 },
			}),
			makeClip({ id: "c2", assetId: "a1", startTime: 5, duration: 5, inPoint: 5, outPoint: 10 }),
		];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		// 같은 에셋이지만 입력이 2개 생성되어야 한다
		const inputCount = args.filter((a) => a === "-i").length;
		expect(inputCount).toBe(2);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		// 두 클립이 각각 [0:v]와 [1:v]를 참조해야 한다
		expect(filterComplex).toContain("[0:v]");
		expect(filterComplex).toContain("[1:v]");
		expect(filterComplex).toContain("xfade=transition=dissolve");
	});

	it("단일 클립 2배속: setpts=PTS/2 비디오 필터와 atempo=2 오디오 필터를 포함한다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10, speed: 2 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const vfIndex = args.indexOf("-vf");
		const vfValue = args[vfIndex + 1] ?? "";
		expect(vfValue).toContain("setpts=PTS/2");

		const afIndex = args.indexOf("-af");
		const afValue = args[afIndex + 1] ?? "";
		expect(afValue).toContain("atempo=2");
	});

	it("단일 클립 2배속: -t 값이 속도 반영된 길이이다", () => {
		const clips = [makeClip({ assetId: "a1", inPoint: 0, outPoint: 10, speed: 2 })];
		const assetFileMap = new Map([["a1", "input_a1.mp4"]]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const tIndex = args.indexOf("-t");
		const tValue = Number(args[tIndex + 1]);
		expect(tValue).toBe(5); // 10초 / 2배속 = 5초
	});

	it("2클립 + 트랜지션 + 속도: xfade offset이 속도 반영된 미디어 길이 기준이다", () => {
		const clips = [
			makeClip({
				id: "c1",
				assetId: "a1",
				startTime: 0,
				duration: 5,
				inPoint: 0,
				outPoint: 10,
				speed: 2,
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
		// 첫 클립: 10초 미디어 / 2배속 = 5초, offset = 5 - 1 = 4
		expect(filterComplex).toContain("xfade=transition=fade:duration=1:offset=4");
	});

	it("concat 모드에서 속도가 있는 클립에 setpts/atempo를 추가한다", () => {
		const clips = [
			makeClip({ id: "c1", assetId: "a1", startTime: 0, inPoint: 0, outPoint: 5, speed: 2 }),
			makeClip({ id: "c2", assetId: "a2", startTime: 5, inPoint: 0, outPoint: 5 }),
		];
		const assetFileMap = new Map([
			["a1", "input_a1.mp4"],
			["a2", "input_a2.mp4"],
		]);
		const args = buildFFmpegArgs(clips, assetFileMap, 1920, 1080);

		const filterComplex = args[args.indexOf("-filter_complex") + 1] ?? "";
		// 첫 클립만 속도 필터 적용
		expect(filterComplex).toMatch(/\[0:v\].*setpts=PTS\/2/);
		expect(filterComplex).toMatch(/\[0:a\].*atempo=2/);
		// 두 번째 클립에는 속도 필터 없음
		expect(filterComplex).not.toMatch(/\[1:v\].*setpts=PTS\/2/);
	});
});

describe("buildSpeedVideoFilter", () => {
	it("1배속이면 null을 반환한다", () => {
		expect(buildSpeedVideoFilter(1)).toBeNull();
	});

	it("2배속이면 setpts=PTS/2를 반환한다", () => {
		expect(buildSpeedVideoFilter(2)).toBe("setpts=PTS/2");
	});

	it("0.5배속이면 setpts=PTS/0.5를 반환한다", () => {
		expect(buildSpeedVideoFilter(0.5)).toBe("setpts=PTS/0.5");
	});
});

describe("buildSpeedAudioFilter", () => {
	it("1배속이면 null을 반환한다", () => {
		expect(buildSpeedAudioFilter(1)).toBeNull();
	});

	it("2배속이면 atempo=2를 반환한다", () => {
		expect(buildSpeedAudioFilter(2)).toBe("atempo=2");
	});

	it("0.5배속이면 atempo=0.5를 반환한다", () => {
		expect(buildSpeedAudioFilter(0.5)).toBe("atempo=0.5");
	});

	it("0.25배속이면 atempo를 체이닝한다", () => {
		const result = buildSpeedAudioFilter(0.25);
		expect(result).toBe("atempo=0.5,atempo=0.5");
	});

	it("4배속이면 atempo를 체이닝한다", () => {
		const result = buildSpeedAudioFilter(4);
		expect(result).toBe("atempo=2.0,atempo=2");
	});
});
