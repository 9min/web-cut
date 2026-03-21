import type { ExportResolution } from "@/types/export";

export const EXPORT_RESOLUTIONS: ExportResolution[] = [
	{ label: "480p", width: 854, height: 480 },
	{ label: "720p", width: 1280, height: 720 },
	{ label: "1080p", width: 1920, height: 1080 },
];

export const DEFAULT_EXPORT_RESOLUTION: ExportResolution = {
	label: "1080p",
	width: 1920,
	height: 1080,
};
