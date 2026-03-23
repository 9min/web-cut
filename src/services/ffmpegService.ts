import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { fallbackDownload } from "./filePickerService";

let ffmpeg: FFmpeg | null = null;

const FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
const CACHE_NAME = "webcut-ffmpeg-v1";

/** Cache API를 활용하여 FFmpeg WASM 바이너리를 캐싱한다 */
async function getCachedBlobURL(url: string, mimeType: string): Promise<string> {
	try {
		const cache = await caches.open(CACHE_NAME);
		const cached = await cache.match(url);
		if (cached) {
			const blob = await cached.blob();
			return URL.createObjectURL(blob);
		}

		const response = await fetch(url);
		await cache.put(url, response.clone());
		const blob = await response.blob();
		return URL.createObjectURL(blob);
	} catch {
		// Cache API 미지원 시 폴백
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

export function downloadBlob(data: Uint8Array, fileName: string, mimeType = "video/mp4"): void {
	const blob = new Blob([new Uint8Array(data)], { type: mimeType });
	// showSaveFilePicker는 사용자 제스처 직후에만 호출 가능하므로,
	// 긴 비동기 작업(인코딩) 이후에는 a.click() 폴백을 사용한다.
	fallbackDownload(blob, fileName);
}
