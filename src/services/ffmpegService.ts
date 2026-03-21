import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
	if (ffmpeg?.loaded) return ffmpeg;

	ffmpeg = new FFmpeg();

	if (onProgress) {
		ffmpeg.on("progress", ({ progress }) => {
			onProgress(Math.round(progress * 100));
		});
	}

	const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

	await ffmpeg.load({
		coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
		wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
	});

	return ffmpeg;
}

export async function writeInputFile(ff: FFmpeg, fileName: string, url: string): Promise<void> {
	const data = await fetchFile(url);
	await ff.writeFile(fileName, data);
}

export async function runExport(ff: FFmpeg, args: string[]): Promise<Uint8Array> {
	await ff.exec(args);
	const data = await ff.readFile("output.mp4");
	return data as Uint8Array;
}

export function downloadBlob(data: Uint8Array, fileName: string): void {
	const blob = new Blob([new Uint8Array(data)], { type: "video/mp4" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}
