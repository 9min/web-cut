export const ACCEPTED_VIDEO_TYPES = [
	"video/mp4",
	"video/webm",
	"video/ogg",
	"video/quicktime",
] as const;

export const ACCEPTED_AUDIO_TYPES = [
	"audio/mpeg",
	"audio/wav",
	"audio/ogg",
	"audio/aac",
	"audio/webm",
] as const;

export const ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
] as const;

export const ALL_ACCEPTED_TYPES = [
	...ACCEPTED_VIDEO_TYPES,
	...ACCEPTED_AUDIO_TYPES,
	...ACCEPTED_IMAGE_TYPES,
] as const;

export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const ACCEPT_STRING = ALL_ACCEPTED_TYPES.join(",");
