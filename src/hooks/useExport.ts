import { useCallback } from "react";
import { downloadBlob, getFFmpeg, runExport, writeInputFile } from "@/services/ffmpegService";
import { useExportStore } from "@/stores/useExportStore";
import { useMediaStore } from "@/stores/useMediaStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { buildFFmpegArgs, getSortedVideoClips } from "@/utils/exportUtils";

export function useExport() {
	const status = useExportStore((s) => s.status);
	const progress = useExportStore((s) => s.progress);
	const resolution = useExportStore((s) => s.resolution);
	const error = useExportStore((s) => s.error);

	const startExport = useCallback(async () => {
		const { setStatus, setProgress, setError, resolution: res } = useExportStore.getState();
		const tracks = useTimelineStore.getState().tracks;
		const assets = useMediaStore.getState().assets;
		const projectName = useProjectStore.getState().name;

		const clips = getSortedVideoClips(tracks);
		if (clips.length === 0) {
			setError("내보낼 클립이 없습니다.");
			return;
		}

		try {
			setStatus("preparing");
			setProgress(0);

			const ff = await getFFmpeg((p) => setProgress(p));

			// 입력 파일 쓰기
			const assetFileMap = new Map<string, string>();
			const writtenAssets = new Set<string>();

			for (const clip of clips) {
				if (writtenAssets.has(clip.assetId)) continue;

				const asset = assets.find((a) => a.id === clip.assetId);
				if (!asset) continue;

				const ext = asset.mimeType.includes("mp4") ? "mp4" : "webm";
				const fileName = `input_${clip.assetId}.${ext}`;
				await writeInputFile(ff, fileName, asset.objectUrl);
				assetFileMap.set(clip.assetId, fileName);
				writtenAssets.add(clip.assetId);
			}

			// FFmpeg 실행
			setStatus("encoding");
			const args = buildFFmpegArgs(clips, assetFileMap, res.width, res.height);

			if (args.length === 0) {
				setError("FFmpeg 명령어 생성에 실패했습니다.");
				return;
			}

			const outputData = await runExport(ff, args);

			// 다운로드
			const safeName = projectName.replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
			downloadBlob(outputData, `${safeName}.mp4`);

			setStatus("done");
			setProgress(100);
		} catch (err) {
			const message = err instanceof Error ? err.message : "내보내기 중 오류가 발생했습니다.";
			setError(message);
		}
	}, []);

	return { status, progress, resolution, error, startExport };
}
