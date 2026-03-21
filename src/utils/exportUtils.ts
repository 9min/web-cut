import { TRANSITION_TO_FFMPEG_MAP } from "@/constants/transition";
import type { Clip, Track } from "@/types/timeline";
import { buildEqFilterString } from "@/utils/filterUtils";

export function getSortedVideoClips(tracks: Track[]): Clip[] {
	const clips: Clip[] = [];
	for (const track of tracks) {
		if (track.type !== "video") continue;
		clips.push(...track.clips);
	}
	return clips.sort((a, b) => a.startTime - b.startTime);
}

/** 클립 중 하나라도 outTransition이 있는지 확인 */
function hasAnyTransition(clips: Clip[]): boolean {
	return clips.some((clip) => clip.outTransition);
}

export function buildFFmpegArgs(
	clips: Clip[],
	assetFileMap: Map<string, string>,
	outputWidth: number,
	outputHeight: number,
): string[] {
	if (clips.length === 0) return [];

	if (clips.length === 1) {
		return buildSingleClipArgs(clips[0] as Clip, assetFileMap, outputWidth, outputHeight);
	}

	if (hasAnyTransition(clips)) {
		return buildXfadeArgs(clips, assetFileMap, outputWidth, outputHeight);
	}

	return buildConcatArgs(clips, assetFileMap, outputWidth, outputHeight);
}

function buildSingleClipArgs(
	clip: Clip,
	assetFileMap: Map<string, string>,
	width: number,
	height: number,
): string[] {
	const inputFile = assetFileMap.get(clip.assetId);
	if (!inputFile) return [];

	const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
	const eqFilter = clip.filter ? buildEqFilterString(clip.filter) : null;
	const vf = eqFilter ? `${scaleFilter},${eqFilter}` : scaleFilter;

	return [
		"-i",
		inputFile,
		"-ss",
		String(clip.inPoint),
		"-t",
		String(clip.outPoint - clip.inPoint),
		"-vf",
		vf,
		"-c:v",
		"libx264",
		"-preset",
		"fast",
		"-c:a",
		"aac",
		"-movflags",
		"+faststart",
		"output.mp4",
	];
}

function buildConcatArgs(
	clips: Clip[],
	assetFileMap: Map<string, string>,
	width: number,
	height: number,
): string[] {
	const args: string[] = [];
	const inputIndices = new Map<string, number>();
	let inputIndex = 0;

	// 입력 파일 추가 (중복 제거)
	for (const clip of clips) {
		if (!inputIndices.has(clip.assetId)) {
			const file = assetFileMap.get(clip.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(clip.assetId, inputIndex);
			inputIndex++;
		}
	}

	// filter_complex 구성
	const filterParts: string[] = [];
	const concatInputs: string[] = [];

	for (let i = 0; i < clips.length; i++) {
		const clip = clips[i] as Clip;
		const idx = inputIndices.get(clip.assetId);
		if (idx === undefined) continue;

		const trimStart = clip.inPoint;
		const trimEnd = clip.outPoint;
		const eqFilter = clip.filter ? buildEqFilterString(clip.filter) : null;
		const eqPart = eqFilter ? `,${eqFilter}` : "";

		filterParts.push(
			`[${idx}:v]trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2${eqPart}[v${i}]`,
		);
		filterParts.push(
			`[${idx}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS[a${i}]`,
		);
		concatInputs.push(`[v${i}][a${i}]`);
	}

	const concatFilter = `${concatInputs.join("")}concat=n=${clips.length}:v=1:a=1[outv][outa]`;
	filterParts.push(concatFilter);

	args.push("-filter_complex", filterParts.join(";"));
	args.push("-map", "[outv]", "-map", "[outa]");
	args.push("-c:v", "libx264", "-preset", "fast");
	args.push("-c:a", "aac");
	args.push("-movflags", "+faststart");
	args.push("output.mp4");

	return args;
}

function buildXfadeArgs(
	clips: Clip[],
	assetFileMap: Map<string, string>,
	width: number,
	height: number,
): string[] {
	const args: string[] = [];
	const inputIndices = new Map<string, number>();
	let inputIndex = 0;

	// 입력 파일 추가 (중복 제거)
	for (const clip of clips) {
		if (!inputIndices.has(clip.assetId)) {
			const file = assetFileMap.get(clip.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(clip.assetId, inputIndex);
			inputIndex++;
		}
	}

	const filterParts: string[] = [];

	// 각 클립을 trim + scale
	for (let i = 0; i < clips.length; i++) {
		const clip = clips[i] as Clip;
		const idx = inputIndices.get(clip.assetId);
		if (idx === undefined) continue;

		const eqFilter = clip.filter ? buildEqFilterString(clip.filter) : null;
		const eqPart = eqFilter ? `,${eqFilter}` : "";

		filterParts.push(
			`[${idx}:v]trim=start=${clip.inPoint}:end=${clip.outPoint},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2${eqPart}[v${i}]`,
		);
		filterParts.push(
			`[${idx}:a]atrim=start=${clip.inPoint}:end=${clip.outPoint},asetpts=PTS-STARTPTS[a${i}]`,
		);
	}

	// xfade / acrossfade 체인 구성
	let cumulativeDuration = clips[0] ? clips[0].outPoint - clips[0].inPoint : 0;
	let lastVideoLabel = "[v0]";
	let lastAudioLabel = "[a0]";

	for (let i = 1; i < clips.length; i++) {
		const prevClip = clips[i - 1] as Clip;
		const transition = prevClip.outTransition;

		if (transition) {
			const ffmpegTransition = TRANSITION_TO_FFMPEG_MAP[transition.type];
			const offset = cumulativeDuration - transition.duration;
			const vOutLabel = i < clips.length - 1 ? `[vout${i}]` : "[outv]";
			const aOutLabel = i < clips.length - 1 ? `[aout${i}]` : "[outa]";

			filterParts.push(
				`${lastVideoLabel}[v${i}]xfade=transition=${ffmpegTransition}:duration=${transition.duration}:offset=${offset}${vOutLabel}`,
			);
			filterParts.push(`${lastAudioLabel}[a${i}]acrossfade=d=${transition.duration}${aOutLabel}`);

			lastVideoLabel = vOutLabel;
			lastAudioLabel = aOutLabel;
			cumulativeDuration = offset + (clips[i] ? clips[i].outPoint - clips[i].inPoint : 0);
		} else {
			// 트랜지션 없는 클립 간: concat 사용
			const vOutLabel = i < clips.length - 1 ? `[vcat${i}]` : "[outv]";
			const aOutLabel = i < clips.length - 1 ? `[acat${i}]` : "[outa]";

			filterParts.push(`${lastVideoLabel}[v${i}]concat=n=2:v=1:a=0${vOutLabel}`);
			filterParts.push(`${lastAudioLabel}[a${i}]concat=n=2:v=0:a=1${aOutLabel}`);

			lastVideoLabel = vOutLabel;
			lastAudioLabel = aOutLabel;
			cumulativeDuration += clips[i] ? clips[i].outPoint - clips[i].inPoint : 0;
		}
	}

	args.push("-filter_complex", filterParts.join(";"));
	args.push("-map", "[outv]", "-map", "[outa]");
	args.push("-c:v", "libx264", "-preset", "fast");
	args.push("-c:a", "aac");
	args.push("-movflags", "+faststart");
	args.push("output.mp4");

	return args;
}
