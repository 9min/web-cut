import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
	fallbackDownload,
	MP4_ACCEPT_TYPES,
	saveFileWithPicker,
	supportsFilePicker,
	WEBM_ACCEPT_TYPES,
} from "./filePickerService";

let ffmpeg: FFmpeg | null = null;

const FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
const CACHE_NAME = "webcut-ffmpeg-v3";

/** 이전 버전의 FFmpeg 캐시를 삭제한다 */
async function cleanOldCaches(): Promise<void> {
	try {
		const keys = await caches.keys();
		for (const key of keys) {
			if (key.startsWith("webcut-ffmpeg-") && key !== CACHE_NAME) {
				await caches.delete(key);
			}
		}
	} catch {
		// 무시
	}
}

/** Cache API를 활용하여 FFmpeg WASM 바이너리를 캐싱한다 */
async function getCachedBlobURL(url: string, mimeType: string): Promise<string> {
	try {
		const cache = await caches.open(CACHE_NAME);
		const cached = await cache.match(url);
		if (cached) {
			const blob = await cached.blob();
			if (blob.size > 0) {
				return URL.createObjectURL(blob);
			}
			// 손상된 캐시 엔트리 삭제
			await cache.delete(url);
		}

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`FFmpeg 리소스 로드 실패: HTTP ${response.status}`);
		}
		await cache.put(url, response.clone());
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch {
		// Cache API 미지원 또는 fetch 실패 시 폴백
		return toBlobURL(url, mimeType);
	}
}

export async function getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
	if (ffmpeg?.loaded) return ffmpeg;

	ffmpeg = new FFmpeg();

	if (onProgress) {
		ffmpeg.on("progress", ({ progress }) => {
			onProgress(Math.round(progress * 100));
		});
	}

	await ffmpeg.load({
		coreURL: await getCachedBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
		wasmURL: await getCachedBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
	});

	// 이전 버전 캐시 정리 (비동기, 로드 성공 후 백그라운드)
	cleanOldCaches();

	return ffmpeg;
}

export async function writeInputFile(ff: FFmpeg, fileName: string, url: string): Promise<void> {
	const data = await fetchFile(url);
	await ff.writeFile(fileName, data);
}

export async function runExport(ff: FFmpeg, args: string[]): Promise<Uint8Array> {
	await ff.exec(args);
	// 출력 파일명은 args의 마지막 요소
	const outputFile = args[args.length - 1] ?? "output.mp4";
	const data = await ff.readFile(outputFile);
	return data as Uint8Array;
}

export async function downloadBlob(
	data: Uint8Array,
	fileName: string,
	mimeType = "video/mp4",
): Promise<void> {
	const blob = new Blob([new Uint8Array(data)], { type: mimeType });

	// showSaveFilePicker를 먼저 시도 (로컬 환경에서는 스트리밍 쓰기로 더 빠르다)
	// 프로덕션에서는 user gesture 만료로 실패할 수 있으므로 폴백 처리
	if (supportsFilePicker()) {
		try {
			const acceptTypes = mimeType.includes("webm") ? WEBM_ACCEPT_TYPES : MP4_ACCEPT_TYPES;
			await saveFileWithPicker(blob, fileName, acceptTypes);
			return;
		} catch {
			// user gesture 만료 등으로 실패 시 폴백
		}
	}

	fallbackDownload(blob, fileName);
}
