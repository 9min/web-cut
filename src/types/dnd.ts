export const DND_TYPES = {
	MEDIA_ITEM: "media-item",
	TIMELINE_CLIP: "timeline-clip",
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

export type DragData = MediaDragData | ClipDragData;
