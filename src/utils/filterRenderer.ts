import type { ColorMatrixFilter, Sprite } from "pixi.js";
import type { ClipFilter } from "@/types/filter";
import { toPixiBrightness, toPixiContrast, toPixiSaturation } from "@/utils/filterUtils";

/** 클립 필터를 PixiJS ColorMatrixFilter에 적용 */
export function applyClipFilter(
	sprite: Sprite,
	colorFilter: ColorMatrixFilter,
	filter: ClipFilter,
): void {
	colorFilter.reset();
	colorFilter.brightness(toPixiBrightness(filter.brightness), false);
	colorFilter.contrast(toPixiContrast(filter.contrast), true);
	colorFilter.saturate(toPixiSaturation(filter.saturation), true);

	if (!sprite.filters || !sprite.filters.includes(colorFilter)) {
		sprite.filters = [colorFilter];
	}
}

/** 클립 필터를 리셋 */
export function clearClipFilter(sprite: Sprite, colorFilter: ColorMatrixFilter): void {
	colorFilter.reset();
	if (sprite.filters) {
		sprite.filters = sprite.filters.filter((f) => f !== colorFilter);
		if (sprite.filters.length === 0) {
			sprite.filters = [];
		}
	}
}
