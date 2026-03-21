import type { ClipFilter } from "./filter";
import type { TextClip } from "./textOverlay";
import type { Transition } from "./transition";

export type TrackType = "video" | "audio" | "text";

export interface Clip {
	id: string;
	trackId: string;
	assetId: string;
	name: string;
	startTime: number;
	duration: number;
	inPoint: number;
	outPoint: number;
	outTransition?: Transition;
	filter?: ClipFilter;
}

export interface Track {
	id: string;
	name: string;
	type: TrackType;
	clips: Clip[];
	textClips: TextClip[];
	muted: boolean;
	locked: boolean;
	order: number;
}
