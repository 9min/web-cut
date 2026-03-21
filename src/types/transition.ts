export type TransitionType = "fade" | "dissolve" | "wipe-left" | "wipe-right";

export interface Transition {
	type: TransitionType;
	duration: number;
}
