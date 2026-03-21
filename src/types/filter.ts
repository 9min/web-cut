export type FilterType = "brightness" | "contrast" | "saturation";

export interface ClipFilter {
	brightness: number; // -100 ~ +100, 기본값 0
	contrast: number; // -100 ~ +100, 기본값 0
	saturation: number; // -100 ~ +100, 기본값 0
}
