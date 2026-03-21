export type VideoFormat = "mp4" | "webm";
export type VideoCodec = "libx264" | "libvpx-vp9";
export type QualityPreset = "high" | "medium" | "low";

export interface ExportFormatSettings {
	format: VideoFormat;
	quality: QualityPreset;
}

export const CODEC_MAP: Record<VideoFormat, VideoCodec> = {
	mp4: "libx264",
	webm: "libvpx-vp9",
};

export const QUALITY_CRF: Record<VideoFormat, Record<QualityPreset, number>> = {
	mp4: { high: 18, medium: 23, low: 28 },
	webm: { high: 20, medium: 30, low: 40 },
};

export const FORMAT_LABELS: Record<VideoFormat, string> = {
	mp4: "MP4",
	webm: "WebM",
};

export const QUALITY_LABELS: Record<QualityPreset, string> = {
	high: "높음",
	medium: "보통",
	low: "낮음",
};
