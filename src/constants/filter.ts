import type { FilterType } from "@/types/filter";

export const FILTER_MIN = -100;
export const FILTER_MAX = 100;
export const FILTER_DEFAULT = 0;
export const FILTER_STEP = 1;

export const FILTER_TYPES: FilterType[] = ["brightness", "contrast", "saturation"];

export const FILTER_LABELS: Record<FilterType, string> = {
	brightness: "밝기",
	contrast: "대비",
	saturation: "채도",
};

export const DEFAULT_CLIP_FILTER = {
	brightness: FILTER_DEFAULT,
	contrast: FILTER_DEFAULT,
	saturation: FILTER_DEFAULT,
} as const;
