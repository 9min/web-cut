import type { TextOverlay } from "@/types/textOverlay";

export const TEXT_CLIP_DEFAULT_DURATION = 3;

export const TEXT_MAX_LENGTH = 200;

export const TEXT_FONT_SIZE_MIN = 12;
export const TEXT_FONT_SIZE_MAX = 120;
export const TEXT_FONT_SIZE_STEP = 1;

export const TEXT_POSITION_MIN = 0;
export const TEXT_POSITION_MAX = 100;
export const TEXT_POSITION_STEP = 1;

export const TEXT_OPACITY_MIN = 0;
export const TEXT_OPACITY_MAX = 100;
export const TEXT_OPACITY_STEP = 1;

export const TEXT_OVERLAY_DEFAULTS: TextOverlay = {
	content: "",
	x: 50,
	y: 80,
	fontSize: 36,
	fontColor: "#FFFFFF",
	opacity: 100,
};
