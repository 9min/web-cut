import type { ExportResolution } from "@/types/export";

export const EXPORT_RESOLUTIONS: ExportResolution[] = [
	{ label: "360p", width: 640, height: 360 },
	{ label: "480p", width: 854, height: 480 },
	{ label: "720p", width: 1280, height: 720 },
	{ label: "1080p", width: 1920, height: 1080 },
];

export const DEFAULT_EXPORT_RESOLUTION: ExportResolution = {
	label: "1080p",
	width: 1920,
	height: 1080,
};

/** 해상도별 예상 인코딩 속도 힌트 */
export const SPEED_HINTS: Record<string, string> = {
	"360p": "빠름",
	"480p": "보통",
	"720p": "보통",
	"1080p": "느림",
};
