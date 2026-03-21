import type { ClipTransform } from "@/types/timeline";

export const TRANSFORM_DEFAULTS: ClipTransform = {
	x: 50,
	y: 50,
	scaleX: 1,
	scaleY: 1,
	rotation: 0,
};

export const TRANSFORM_POSITION_MIN = 0;
export const TRANSFORM_POSITION_MAX = 100;
export const TRANSFORM_POSITION_STEP = 1;

export const TRANSFORM_SCALE_MIN = 0.1;
export const TRANSFORM_SCALE_MAX = 3;
export const TRANSFORM_SCALE_STEP = 0.01;

export const TRANSFORM_ROTATION_MIN = 0;
export const TRANSFORM_ROTATION_MAX = 360;
export const TRANSFORM_ROTATION_STEP = 1;
