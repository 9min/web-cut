export type EasingType = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface Keyframe<T = number> {
	time: number;
	value: T;
	easing: EasingType;
}

export interface KeyframeTrack<T = number> {
	keyframes: Keyframe<T>[];
}

export interface ClipKeyframes {
	opacity?: KeyframeTrack;
	x?: KeyframeTrack;
	y?: KeyframeTrack;
	scaleX?: KeyframeTrack;
	scaleY?: KeyframeTrack;
	rotation?: KeyframeTrack;
	brightness?: KeyframeTrack;
	contrast?: KeyframeTrack;
	saturation?: KeyframeTrack;
}
