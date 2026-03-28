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
	mp4: { high: 17, medium: 23, low: 28 },
	webm: { high: 20, medium: 30, low: 40 },
};

/** FFmpeg 인코딩 옵션 — buildFFmpegArgs에 전달 */
export interface EncoderOptions {
	codec: VideoCodec;
	crf: number;
	preset: string;
	audioCodec: string;
	outputFile: string;
}

/** WASM 환경 최적 프리셋: 모든 품질에서 ultrafast 사용 (CRF로 품질 보상) */
export const PRESET_MAP: Record<QualityPreset, string> = {
	high: "ultrafast",
	medium: "ultrafast",
	low: "ultrafast",
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
