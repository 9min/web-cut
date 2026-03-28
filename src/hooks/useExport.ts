import { useCallback } from "react";
import type { AssetInput } from "@/services/ffmpegService";
import {
	cleanupWasmFS,
	downloadBlob,
	fetchInputFiles,
	getFFmpeg,
	runExport,
} from "@/services/ffmpegService";
import { useExportStore } from "@/stores/useExportStore";
import { useMediaStore } from "@/stores/useMediaStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { EncoderOptions } from "@/types/exportSettings";
import { CODEC_MAP, PRESET_MAP, QUALITY_CRF } from "@/types/exportSettings";
import {
	buildFFmpegArgs,
	canUseStreamCopy,
	getSortedAudioClips,
	getSortedVideoClips,
} from "@/utils/exportUtils";

/** 취소 여부를 확인하고 취소된 경우 에러를 던진다 */
function checkCancelled(signal: AbortSignal): void {
	if (signal.aborted) {
		throw new DOMException("내보내기가 취소되었습니다.", "AbortError");
	}
}

export function useExport() {
	const status = useExportStore((s) => s.status);
	const progress = useExportStore((s) => s.progress);
	const resolution = useExportStore((s) => s.resolution);
	const error = useExportStore((s) => s.error);

	const startExport = useCallback(async () => {
		const store = useExportStore.getState();
		const { setStatus, setProgress, setError, resolution: res, formatSettings } = store;
		const { format, quality } = formatSettings;
		const tracks = useTimelineStore.getState().tracks;
		const assets = useMediaStore.getState().assets;
		const projectName = useProjectStore.getState().name;

		const clips = getSortedVideoClips(tracks);
		if (clips.length === 0) {
			setError("내보낼 클립이 없습니다.");
			return;
		}

		const abortController = new AbortController();
		useExportStore.setState({ abortController });
		const { signal } = abortController;

		try {
			// 단계 1: 준비 (0-5%)
			setStatus("preparing");
			setProgress(0);

			const ff = await getFFmpeg((p) => {
				// 인코딩 단계에서 FFmpeg 진행률 매핑 (30-95%)
				const mapped = Math.round(30 + p * 0.65);
				setProgress(mapped);
			});

			checkCancelled(signal);

			// 단계 2: 파일 쓰기 (5-30%)
			setStatus("writing-files");
			setProgress(5);

			const assetFileMap = new Map<string, string>();
			const uniqueAssetInputs: AssetInput[] = [];
			const writtenAssets = new Set<string>();

			// 비디오 클립 에셋 수집
			for (const clip of clips) {
				if (writtenAssets.has(clip.assetId)) continue;
				const asset = assets.find((a) => a.id === clip.assetId);
				if (!asset) continue;
				const ext = asset.mimeType.includes("mp4") ? "mp4" : "webm";
				const fileName = `input_${clip.assetId}.${ext}`;
				uniqueAssetInputs.push({ fileName, url: asset.objectUrl });
				assetFileMap.set(clip.assetId, fileName);
				writtenAssets.add(clip.assetId);
			}

			// 오디오 클립 에셋 수집
			const audioClips = getSortedAudioClips(tracks);
			for (const audioClip of audioClips) {
				if (writtenAssets.has(audioClip.assetId)) continue;
				const asset = assets.find((a) => a.id === audioClip.assetId);
				if (!asset) continue;
				const ext = asset.mimeType.includes("mp3")
					? "mp3"
					: asset.mimeType.includes("wav")
						? "wav"
						: asset.mimeType.includes("ogg")
							? "ogg"
							: "mp3";
				const fileName = `input_${audioClip.assetId}.${ext}`;
				uniqueAssetInputs.push({ fileName, url: asset.objectUrl });
				assetFileMap.set(audioClip.assetId, fileName);
				writtenAssets.add(audioClip.assetId);
			}

			checkCancelled(signal);

			// 병렬 fetch → 순차 WASM FS 쓰기
			const fetchedAssets = await fetchInputFiles(uniqueAssetInputs);
			for (const { fileName, data } of fetchedAssets) {
				checkCancelled(signal);
				await ff.writeFile(fileName, data);
			}

			setProgress(30);
			checkCancelled(signal);

			// 단계 3: 인코딩 (30-95%)
			setStatus("encoding");
			const encoderOpts: EncoderOptions = {
				codec: CODEC_MAP[format],
				crf: QUALITY_CRF[format][quality],
				preset: PRESET_MAP[quality],
				audioCodec: format === "webm" ? "libopus" : "aac",
				outputFile: `output.${format}`,
			};
			const streamCopy = canUseStreamCopy(clips, tracks);
			let args = buildFFmpegArgs(
				clips,
				assetFileMap,
				res.width,
				res.height,
				tracks,
				encoderOpts,
				streamCopy,
			);

			if (args.length === 0) {
				setError("FFmpeg 명령어 생성에 실패했습니다.");
				return;
			}

			let outputData = await runExport(ff, args);

			// 스트림 복사가 0바이트 출력을 생성한 경우 재인코딩으로 폴백
			if (streamCopy && outputData.length === 0) {
				args = buildFFmpegArgs(
					clips,
					assetFileMap,
					res.width,
					res.height,
					tracks,
					encoderOpts,
					false,
				);
				outputData = await runExport(ff, args);
			}
			checkCancelled(signal);

			// 단계 4: 마무리 (95-100%)
			setStatus("finalizing");
			setProgress(95);

			const mimeType = format === "webm" ? "video/webm" : "video/mp4";
			const safeName = projectName.replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
			await downloadBlob(outputData, `${safeName}.${format}`, mimeType);

			// WASM FS 임시 파일 정리
			await cleanupWasmFS(ff);

			setStatus("done");
			setProgress(100);
			useExportStore.setState({ abortController: null });

			// 3초 후 자동으로 idle 상태로 복귀
			setTimeout(() => {
				if (useExportStore.getState().status === "done") {
					useExportStore.getState().reset();
				}
			}, 3000);
		} catch (err) {
			if (err instanceof DOMException && err.name === "AbortError") {
				// 취소 시 상태는 cancelExport에서 이미 설정됨
				return;
			}
			const message = err instanceof Error ? err.message : "내보내기 중 오류가 발생했습니다.";
			setError(message);
			useExportStore.setState({ abortController: null });
		}
	}, []);

	const cancelExport = useCallback(() => {
		useExportStore.getState().cancelExport();
	}, []);

	return { status, progress, resolution, error, startExport, cancelExport };
}
