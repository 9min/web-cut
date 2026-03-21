import { TRANSITION_TO_FFMPEG_MAP } from "@/constants/transition";
import type { Clip, ClipTransform, Track } from "@/types/timeline";
import { buildEqFilterString } from "@/utils/filterUtils";
import { buildDrawtextFilter } from "@/utils/textOverlayExport";

export function getSortedVideoClips(tracks: Track[]): Clip[] {
	const clips: Clip[] = [];
	for (const track of tracks) {
		if (track.type !== "video") continue;
		clips.push(...track.clips);
	}
	return clips.sort((a, b) => a.startTime - b.startTime);
}

export function getSortedAudioClips(tracks: Track[]): Clip[] {
	const clips: Clip[] = [];
	for (const track of tracks) {
		if (track.type !== "audio") continue;
		clips.push(...track.clips);
	}
	return clips.sort((a, b) => a.startTime - b.startTime);
}

function buildTransformFilter(
	transform: ClipTransform,
	width: number,
	height: number,
): string | null {
	const isDefault =
		transform.x === 50 &&
		transform.y === 50 &&
		transform.scaleX === 1 &&
		transform.scaleY === 1 &&
		transform.rotation === 0;
	if (isDefault) return null;

	const parts: string[] = [];

	if (transform.rotation !== 0) {
		const radians = (transform.rotation * Math.PI) / 180;
		parts.push(`rotate=${radians.toFixed(4)}`);
	}

	if (transform.scaleX !== 1 || transform.scaleY !== 1) {
		const sw = Math.round(width * transform.scaleX);
		const sh = Math.round(height * transform.scaleY);
		parts.push(`scale=${sw}:${sh}`);
	}

	if (transform.x !== 50 || transform.y !== 50) {
		const ox = Math.round(((transform.x - 50) / 100) * width);
		const oy = Math.round(((transform.y - 50) / 100) * height);
		parts.push(`pad=${width}:${height}:${-ox}:${-oy}`);
	}

	return parts.length > 0 ? parts.join(",") : null;
}

/** 클립 중 하나라도 outTransition이 있는지 확인 */
function hasAnyTransition(clips: Clip[]): boolean {
	return clips.some((clip) => clip.outTransition);
}

/** 텍스트 트랙에서 drawtext 필터 배열을 생성한다 */
function buildTextClipFilters(tracks: Track[], width: number, height: number): string[] {
	const filters: string[] = [];
	for (const track of tracks) {
		if (track.type !== "text") continue;
		for (const textClip of track.textClips) {
			const endTime = textClip.startTime + textClip.duration;
			const dt = buildDrawtextFilter(textClip.overlay, width, height, textClip.startTime, endTime);
			if (dt) filters.push(dt);
		}
	}
	return filters;
}

/** 오디오 클립 믹싱 필터를 생성한다 */
export function buildAudioMixFilter(
	audioClips: Clip[],
	inputIndexMap: Map<string, number>,
	videoAudioLabel: string,
): { filterParts: string[]; outputLabel: string } {
	if (audioClips.length === 0) {
		return { filterParts: [], outputLabel: videoAudioLabel };
	}

	const filterParts: string[] = [];
	const mixInputLabels: string[] = [videoAudioLabel];

	for (let i = 0; i < audioClips.length; i++) {
		const clip = audioClips[i] as Clip;
		const idx = inputIndexMap.get(clip.assetId);
		if (idx === undefined) continue;

		const delayMs = Math.round(clip.startTime * 1000);
		const volume = clip.volume ?? 1;
		const label = `[audiomix${i}]`;

		let filter = `[${idx}:a]atrim=start=${clip.inPoint}:end=${clip.outPoint},asetpts=PTS-STARTPTS`;
		if (delayMs > 0) {
			filter += `,adelay=${delayMs}|${delayMs}`;
		}
		filter += `,volume=${volume}${label}`;
		filterParts.push(filter);
		mixInputLabels.push(label);
	}

	const outLabel = "[outa]";
	filterParts.push(
		`${mixInputLabels.join("")}amix=inputs=${mixInputLabels.length}:duration=longest${outLabel}`,
	);

	return { filterParts, outputLabel: outLabel };
}

export function buildFFmpegArgs(
	clips: Clip[],
	assetFileMap: Map<string, string>,
	outputWidth: number,
	outputHeight: number,
	tracks?: Track[],
): string[] {
	if (clips.length === 0) return [];

	if (clips.length === 1) {
		return buildSingleClipArgs(clips[0] as Clip, assetFileMap, outputWidth, outputHeight, tracks);
	}

	if (hasAnyTransition(clips)) {
		return buildXfadeArgs(clips, assetFileMap, outputWidth, outputHeight, tracks);
	}

	return buildConcatArgs(clips, assetFileMap, outputWidth, outputHeight, tracks);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 오디오 믹싱 경로 분기 포함
function buildSingleClipArgs(
	clip: Clip,
	assetFileMap: Map<string, string>,
	width: number,
	height: number,
	tracks?: Track[],
): string[] {
	const inputFile = assetFileMap.get(clip.assetId);
	if (!inputFile) return [];

	// 오디오 클립 수집
	const audioClips = tracks ? getSortedAudioClips(tracks) : [];

	// 오디오 클립이 있으면 filter_complex 모드로 전환
	if (audioClips.length > 0) {
		const args: string[] = ["-i", inputFile];

		// 오디오 입력 파일 추가
		const inputIndexMap = new Map<string, number>();
		inputIndexMap.set(clip.assetId, 0);
		let inputIndex = 1;
		for (const ac of audioClips) {
			if (!inputIndexMap.has(ac.assetId)) {
				const file = assetFileMap.get(ac.assetId);
				if (!file) continue;
				args.push("-i", file);
				inputIndexMap.set(ac.assetId, inputIndex);
				inputIndex++;
			}
		}

		const filterParts: string[] = [];

		// 비디오 필터
		const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
		const eqFilter = clip.filter ? buildEqFilterString(clip.filter) : null;
		const transformFilter = clip.transform
			? buildTransformFilter(clip.transform, width, height)
			: null;
		let vf = `[0:v]trim=start=${clip.inPoint}:end=${clip.outPoint},setpts=PTS-STARTPTS,${scaleFilter}`;
		if (eqFilter) vf += `,${eqFilter}`;
		if (transformFilter) vf += `,${transformFilter}`;

		const textFilters = tracks ? buildTextClipFilters(tracks, width, height) : [];
		for (const tf of textFilters) {
			vf += `,${tf}`;
		}
		filterParts.push(`${vf}[outv]`);

		// 비디오의 내장 오디오 (이미지 파일은 오디오 스트림이 없으므로 무음 생성)
		const isImage = /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(inputFile);
		let videoAudioLabel: string;
		if (isImage) {
			const duration = clip.outPoint - clip.inPoint;
			filterParts.push("anullsrc=r=44100:cl=stereo[nullaudio]");
			filterParts.push(`[nullaudio]atrim=duration=${duration},asetpts=PTS-STARTPTS[vidasrc]`);
			videoAudioLabel = "[vidasrc]";
		} else {
			filterParts.push(
				`[0:a]atrim=start=${clip.inPoint}:end=${clip.outPoint},asetpts=PTS-STARTPTS[vidasrc]`,
			);
			videoAudioLabel = "[vidasrc]";
		}

		// 오디오 믹싱
		const audioMix = buildAudioMixFilter(audioClips, inputIndexMap, videoAudioLabel);
		filterParts.push(...audioMix.filterParts);

		args.push("-filter_complex", filterParts.join(";"));
		args.push("-map", "[outv]", "-map", audioMix.outputLabel);
		args.push("-c:v", "libx264", "-preset", "fast");
		args.push("-c:a", "aac");
		args.push("-movflags", "+faststart");
		args.push("output.mp4");
		return args;
	}

	// 오디오 클립 없는 기존 경로
	const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
	const eqFilter = clip.filter ? buildEqFilterString(clip.filter) : null;
	const transformFilter = clip.transform
		? buildTransformFilter(clip.transform, width, height)
		: null;
	let vf = eqFilter ? `${scaleFilter},${eqFilter}` : scaleFilter;
	if (transformFilter) vf = `${vf},${transformFilter}`;

	// 독립 텍스트 클립 필터 추가
	if (tracks) {
		const textFilters = buildTextClipFilters(tracks, width, height);
		for (const tf of textFilters) {
			vf = `${vf},${tf}`;
		}
	}

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
	tracks?: Track[],
): string[] {
	const args: string[] = [];
	const inputIndices = new Map<string, number>();
	let inputIndex = 0;

	// 비디오 입력 파일 추가 (중복 제거)
	for (const clip of clips) {
		if (!inputIndices.has(clip.assetId)) {
			const file = assetFileMap.get(clip.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(clip.assetId, inputIndex);
			inputIndex++;
		}
	}

	// 오디오 클립 입력 파일 추가
	const audioClips = tracks ? getSortedAudioClips(tracks) : [];
	for (const ac of audioClips) {
		if (!inputIndices.has(ac.assetId)) {
			const file = assetFileMap.get(ac.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(ac.assetId, inputIndex);
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
		const transformFilter = clip.transform
			? buildTransformFilter(clip.transform, width, height)
			: null;
		const transformPart = transformFilter ? `,${transformFilter}` : "";

		filterParts.push(
			`[${idx}:v]trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2${eqPart}${transformPart}[v${i}]`,
		);
		filterParts.push(
			`[${idx}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS[a${i}]`,
		);
		concatInputs.push(`[v${i}][a${i}]`);
	}

	// 독립 텍스트 클립 필터 체이닝
	const textFilters = tracks ? buildTextClipFilters(tracks, width, height) : [];
	const concatAudioLabel = audioClips.length > 0 ? "[concataudio]" : "[outa]";

	if (textFilters.length > 0) {
		const concatFilter = `${concatInputs.join("")}concat=n=${clips.length}:v=1:a=1[vconcatout]${concatAudioLabel}`;
		filterParts.push(concatFilter);
		let lastLabel = "[vconcatout]";
		for (let i = 0; i < textFilters.length; i++) {
			const outLabel = i === textFilters.length - 1 ? "[outv]" : `[vtxt${i}]`;
			filterParts.push(`${lastLabel}${textFilters[i]}${outLabel}`);
			lastLabel = outLabel;
		}
	} else {
		const concatFilter = `${concatInputs.join("")}concat=n=${clips.length}:v=1:a=1[outv]${concatAudioLabel}`;
		filterParts.push(concatFilter);
	}

	// 오디오 믹싱
	if (audioClips.length > 0) {
		const audioMix = buildAudioMixFilter(audioClips, inputIndices, concatAudioLabel);
		filterParts.push(...audioMix.filterParts);
	}

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
	tracks?: Track[],
): string[] {
	const args: string[] = [];
	const inputIndices = new Map<string, number>();
	let inputIndex = 0;

	// 비디오 입력 파일 추가 (중복 제거)
	for (const clip of clips) {
		if (!inputIndices.has(clip.assetId)) {
			const file = assetFileMap.get(clip.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(clip.assetId, inputIndex);
			inputIndex++;
		}
	}

	// 오디오 클립 입력 파일 추가
	const audioClips = tracks ? getSortedAudioClips(tracks) : [];
	for (const ac of audioClips) {
		if (!inputIndices.has(ac.assetId)) {
			const file = assetFileMap.get(ac.assetId);
			if (!file) continue;
			args.push("-i", file);
			inputIndices.set(ac.assetId, inputIndex);
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
		const transformFilter = clip.transform
			? buildTransformFilter(clip.transform, width, height)
			: null;
		const transformPart = transformFilter ? `,${transformFilter}` : "";

		filterParts.push(
			`[${idx}:v]trim=start=${clip.inPoint}:end=${clip.outPoint},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2${eqPart}${transformPart}[v${i}]`,
		);
		filterParts.push(
			`[${idx}:a]atrim=start=${clip.inPoint}:end=${clip.outPoint},asetpts=PTS-STARTPTS[a${i}]`,
		);
	}

	// 독립 텍스트 클립 필터
	const textFilters = tracks ? buildTextClipFilters(tracks, width, height) : [];
	const needsTextChain = textFilters.length > 0;
	const hasAudioClips = audioClips.length > 0;

	// xfade / acrossfade 체인 구성
	let cumulativeDuration = clips[0] ? clips[0].outPoint - clips[0].inPoint : 0;
	let lastVideoLabel = "[v0]";
	let lastAudioLabel = "[a0]";

	for (let i = 1; i < clips.length; i++) {
		const prevClip = clips[i - 1] as Clip;
		const transition = prevClip.outTransition;
		const isLast = i === clips.length - 1;

		if (transition) {
			const ffmpegTransition = TRANSITION_TO_FFMPEG_MAP[transition.type];
			const offset = cumulativeDuration - transition.duration;
			const vOutLabel = isLast ? (needsTextChain ? "[vxfadeout]" : "[outv]") : `[vout${i}]`;
			const aOutLabel = isLast ? (hasAudioClips ? "[xfadeaudio]" : "[outa]") : `[aout${i}]`;

			filterParts.push(
				`${lastVideoLabel}[v${i}]xfade=transition=${ffmpegTransition}:duration=${transition.duration}:offset=${offset}${vOutLabel}`,
			);
			filterParts.push(`${lastAudioLabel}[a${i}]acrossfade=d=${transition.duration}${aOutLabel}`);

			lastVideoLabel = vOutLabel;
			lastAudioLabel = aOutLabel;
			const xClip = clips[i];
			cumulativeDuration = offset + (xClip ? xClip.outPoint - xClip.inPoint : 0);
		} else {
			// 트랜지션 없는 클립 간: concat 사용
			const vOutLabel = isLast ? (needsTextChain ? "[vcatout]" : "[outv]") : `[vcat${i}]`;
			const aOutLabel = isLast ? (hasAudioClips ? "[xfadeaudio]" : "[outa]") : `[acat${i}]`;

			filterParts.push(`${lastVideoLabel}[v${i}]concat=n=2:v=1:a=0${vOutLabel}`);
			filterParts.push(`${lastAudioLabel}[a${i}]concat=n=2:v=0:a=1${aOutLabel}`);

			lastVideoLabel = vOutLabel;
			lastAudioLabel = aOutLabel;
			const cClip = clips[i];
			cumulativeDuration += cClip ? cClip.outPoint - cClip.inPoint : 0;
		}
	}

	// 텍스트 필터 체이닝
	if (needsTextChain) {
		let srcLabel = lastVideoLabel;
		for (let i = 0; i < textFilters.length; i++) {
			const outLabel = i === textFilters.length - 1 ? "[outv]" : `[vtxt${i}]`;
			filterParts.push(`${srcLabel}${textFilters[i]}${outLabel}`);
			srcLabel = outLabel;
		}
	}

	// 오디오 믹싱
	if (hasAudioClips) {
		const audioMix = buildAudioMixFilter(audioClips, inputIndices, "[xfadeaudio]");
		filterParts.push(...audioMix.filterParts);
	}

	args.push("-filter_complex", filterParts.join(";"));
	args.push("-map", "[outv]", "-map", "[outa]");
	args.push("-c:v", "libx264", "-preset", "fast");
	args.push("-c:a", "aac");
	args.push("-movflags", "+faststart");
	args.push("output.mp4");

	return args;
}
