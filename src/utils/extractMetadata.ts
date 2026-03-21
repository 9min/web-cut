import type {
	AudioMetadata,
	ImageMetadata,
	MediaMetadata,
	MediaType,
	VideoMetadata,
} from "@/types/media";

const DEFAULT_FPS = 30;
const METADATA_TIMEOUT_MS = 10_000;

export function extractMetadata(file: File, type: MediaType): Promise<MediaMetadata | null> {
	switch (type) {
		case "video":
			return extractVideoMetadata(file);
		case "audio":
			return extractAudioMetadata(file);
		case "image":
			return extractImageMetadata(file);
	}
}

function extractVideoMetadata(file: File): Promise<VideoMetadata | null> {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		const url = URL.createObjectURL(file);
		video.src = url;

		const timer = setTimeout(() => {
			URL.revokeObjectURL(url);
			resolve(null);
		}, METADATA_TIMEOUT_MS);

		video.onloadedmetadata = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve({
				width: video.videoWidth,
				height: video.videoHeight,
				duration: video.duration,
				fps: DEFAULT_FPS,
			});
		};

		video.onerror = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve(null);
		};

		video.load();
	});
}

function extractAudioMetadata(file: File): Promise<AudioMetadata | null> {
	return new Promise((resolve) => {
		const audio = document.createElement("audio");
		const url = URL.createObjectURL(file);
		audio.src = url;

		const timer = setTimeout(() => {
			URL.revokeObjectURL(url);
			resolve(null);
		}, METADATA_TIMEOUT_MS);

		audio.onloadedmetadata = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve({
				duration: audio.duration,
				sampleRate: 0,
				channelCount: 0,
			});
		};

		audio.onerror = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve(null);
		};

		audio.load();
	});
}

function extractImageMetadata(file: File): Promise<ImageMetadata | null> {
	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.src = url;

		const timer = setTimeout(() => {
			URL.revokeObjectURL(url);
			resolve(null);
		}, METADATA_TIMEOUT_MS);

		img.onload = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		};

		img.onerror = () => {
			clearTimeout(timer);
			URL.revokeObjectURL(url);
			resolve(null);
		};
	});
}
