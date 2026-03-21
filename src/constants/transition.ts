import type { TransitionType } from "@/types/transition";

export const MIN_TRANSITION_DURATION = 0.3;
export const MAX_TRANSITION_DURATION = 2.0;
export const DEFAULT_TRANSITION_DURATION = 0.5;

export const TRANSITION_TYPES: TransitionType[] = ["fade", "dissolve", "wipe-left", "wipe-right"];

export const TRANSITION_LABELS: Record<TransitionType, string> = {
	fade: "페이드",
	dissolve: "디졸브",
	"wipe-left": "왼쪽 와이프",
	"wipe-right": "오른쪽 와이프",
};

export const TRANSITION_TO_FFMPEG_MAP: Record<TransitionType, string> = {
	fade: "fade",
	dissolve: "dissolve",
	"wipe-left": "wipeleft",
	"wipe-right": "wiperight",
};
