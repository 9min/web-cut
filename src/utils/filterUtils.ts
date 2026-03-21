import { FILTER_MAX, FILTER_MIN } from "@/constants/filter";
import type { ClipFilter } from "@/types/filter";

/** 모든 필터 값이 기본값(0)인지 확인 */
export function isDefaultFilter(filter: ClipFilter): boolean {
	return filter.brightness === 0 && filter.contrast === 0 && filter.saturation === 0;
}

/** 필터 값을 -100~+100 범위로 클램핑 */
export function clampFilterValue(value: number): number {
	return Math.max(FILTER_MIN, Math.min(FILTER_MAX, value));
}

/** UI 밝기(-100~+100) → PixiJS 밝기(0~2) */
export function toPixiBrightness(value: number): number {
	return (value + 100) / 100;
}

/** UI 대비(-100~+100) → PixiJS 대비(-1~+1). contrast()는 내부적으로 amount+1을 곱하므로 0이 기본값 */
export function toPixiContrast(value: number): number {
	return value / 100;
}

/** UI 채도(-100~+100) → PixiJS 채도(-1~+1) */
export function toPixiSaturation(value: number): number {
	return value / 100;
}

/** UI 밝기(-100~+100) → FFmpeg 밝기(-1~+1) */
export function toFFmpegBrightness(value: number): number {
	return value / 100;
}

/** UI 대비(-100~+100) → FFmpeg 대비(0~2) */
export function toFFmpegContrast(value: number): number {
	return (value + 100) / 100;
}

/** UI 채도(-100~+100) → FFmpeg 채도(0~2) */
export function toFFmpegSaturation(value: number): number {
	return (value + 100) / 100;
}

/** FFmpeg eq 필터 문자열 생성. 기본값이면 null 반환 */
export function buildEqFilterString(filter: ClipFilter): string | null {
	if (isDefaultFilter(filter)) return null;

	const brightness = toFFmpegBrightness(filter.brightness);
	const contrast = toFFmpegContrast(filter.contrast);
	const saturation = toFFmpegSaturation(filter.saturation);

	return `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`;
}
