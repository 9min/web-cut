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

/** 싱글스레드 FFmpeg core URL */
export const FFMPEG_ST_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
/** 멀티스레드 FFmpeg core URL */
export const FFMPEG_MT_BASE_URL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

/** SharedArrayBuffer 지원 여부에 따라 적절한 base URL을 반환한다 */
export function getFFmpegBaseURL(supportsMultiThread: boolean): string {
	return supportsMultiThread ? FFMPEG_MT_BASE_URL : FFMPEG_ST_BASE_URL;
}

/** MT/ST에 따라 분리된 캐시 이름을 반환한다 */
export function getFFmpegCacheName(supportsMultiThread: boolean): string {
	return supportsMultiThread ? "webcut-ffmpeg-mt-v1" : "webcut-ffmpeg-v3";
}

/**
 * 런타임에서 멀티스레드 FFmpeg core 사용 가능 여부를 감지한다.
 * 주의: FFmpeg.wasm MT core는 filter_complex와 함께 사용 시 불안정하므로
 * 현재는 항상 싱글스레드를 사용한다. MT core가 안정화되면 활성화할 수 있다.
 */
function detectMultiThreadSupport(): boolean {
	// MT core는 filter_complex (concat, xfade, 오디오 믹싱)에서 hang이 발생한다.
	// 안정화될 때까지 ST core를 사용한다.
	return false;
}

/** 이전 버전의 FFmpeg 캐시를 삭제한다 */
async function cleanOldCaches(currentCacheName: string): Promise<void> {
	try {
		const keys = await caches.keys();
		for (const key of keys) {
			if (key.startsWith("webcut-ffmpeg-") && key !== currentCacheName) {
				await caches.delete(key);
			}
		}
	} catch {
		// 무시
	}
}

/** Cache API를 활용하여 FFmpeg WASM 바이너리를 캐싱한다 */
async function getCachedBlobURL(url: string, mimeType: string, cacheName: string): Promise<string> {
	try {
		const cache = await caches.open(cacheName);
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

	const supportsMT = detectMultiThreadSupport();
	const baseURL = getFFmpegBaseURL(supportsMT);
	const cacheName = getFFmpegCacheName(supportsMT);

	const loadConfig: Record<string, string> = {
		coreURL: await getCachedBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript", cacheName),
		wasmURL: await getCachedBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm", cacheName),
	};

	// 멀티스레드 core는 별도 worker 파일이 필요하다
	if (supportsMT) {
		loadConfig.workerURL = await getCachedBlobURL(
			`${baseURL}/ffmpeg-core.worker.js`,
			"text/javascript",
			cacheName,
		);
	}

	await ffmpeg.load(loadConfig);

	// 이전 버전 캐시 정리 (비동기, 로드 성공 후 백그라운드)
	cleanOldCaches(cacheName);

	return ffmpeg;
}

export async function writeInputFile(ff: FFmpeg, fileName: string, url: string): Promise<void> {
	const data = await fetchFile(url);
	await ff.writeFile(fileName, data);
}

/** 에셋 입력 정보 */
export interface AssetInput {
	fileName: string;
	url: string;
}

/** fetch 결과 */
export interface FetchedAsset {
	fileName: string;
	data: Uint8Array;
}

/** 여러 에셋의 데이터를 병렬로 fetch한다 (WASM FS 쓰기는 별도 순차 수행) */
export async function fetchInputFiles(assets: AssetInput[]): Promise<FetchedAsset[]> {
	if (assets.length === 0) return [];

	const results = await Promise.all(
		assets.map(async ({ fileName, url }) => {
			const data = await fetchFile(url);
			return { fileName, data: data as Uint8Array };
		}),
	);
	return results;
}

export async function runExport(ff: FFmpeg, args: string[]): Promise<Uint8Array> {
	const exitCode = await ff.exec(args);
	if (exitCode !== 0) {
		throw new Error(
			`FFmpeg 인코딩 실패 (종료 코드: ${exitCode}). 브라우저 콘솔에서 상세 로그를 확인하세요.`,
		);
	}
	// 출력 파일명은 args의 마지막 요소
	const outputFile = args[args.length - 1] ?? "output.mp4";
	const data = await ff.readFile(outputFile);
	return data as Uint8Array;
}

/** WASM 파일시스템의 임시 파일을 정리한다 */
export async function cleanupWasmFS(ff: FFmpeg): Promise<void> {
	try {
		const files = await ff.listDir("/");
		for (const file of files) {
			if (file.name !== "." && file.name !== "..") {
				try {
					await ff.deleteFile(`/${file.name}`);
				} catch {
					// 개별 파일 삭제 실패 무시
				}
			}
		}
	} catch {
		// listDir 실패 무시
	}
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
