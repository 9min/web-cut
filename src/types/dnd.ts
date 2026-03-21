export const DND_TYPES = {
	MEDIA_ITEM: "media-item",
	TIMELINE_CLIP: "timeline-clip",
	TIMELINE_TEXT_CLIP: "timeline-text-clip",
} as const;

export interface MediaDragData {
	type: typeof DND_TYPES.MEDIA_ITEM;
	assetId: string;
}

export interface ClipDragData {
	type: typeof DND_TYPES.TIMELINE_CLIP;
	clipId: string;
	trackId: string;
}

export interface TextClipDragData {
	type: typeof DND_TYPES.TIMELINE_TEXT_CLIP;
	textClipId: string;
	trackId: string;
}

export type DragData = MediaDragData | ClipDragData | TextClipDragData;
