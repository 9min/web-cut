export type MediaType = "video" | "audio" | "image";

export type MediaStatus = "loading" | "ready" | "error";

export interface VideoMetadata {
	width: number;
	height: number;
	duration: number;
	fps: number;
}

export interface AudioMetadata {
	duration: number;
	sampleRate: number;
	channelCount: number;
}

export interface ImageMetadata {
	width: number;
	height: number;
}

export type MediaMetadata = VideoMetadata | AudioMetadata | ImageMetadata;

export interface MediaAsset {
	id: string;
	name: string;
	originalName: string;
	type: MediaType;
	mimeType: string;
	size: number;
	objectUrl: string;
	thumbnailUrl: string | null;
	metadata: MediaMetadata | null;
	status: MediaStatus;
	addedAt: number;
	errorMessage?: string;
}
