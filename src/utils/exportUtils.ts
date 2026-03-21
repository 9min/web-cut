import type { Clip, Track } from "@/types/timeline";

export function getSortedVideoClips(tracks: Track[]): Clip[] {
	const clips: Clip[] = [];
	for (const track of tracks) {
		if (track.type !== "video") continue;
		clips.push(...track.clips);
	}
	return clips.sort((a, b) => a.startTime - b.startTime);
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

	return [
		"-i",
		inputFile,
		"-ss",
		String(clip.inPoint),
		"-t",
		String(clip.outPoint - clip.inPoint),
		"-vf",
		`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
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

		filterParts.push(
			`[${idx}:v]trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[v${i}]`,
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
