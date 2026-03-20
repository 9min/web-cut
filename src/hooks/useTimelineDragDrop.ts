import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { DragData, MediaDragData } from "@/types/dnd";
import { DND_TYPES } from "@/types/dnd";
import { generateId } from "@/utils/generateId";
import { sanitizeFileName } from "@/utils/sanitizeFileName";
import { findInsertPosition } from "@/utils/timelineUtils";

interface UseTimelineDragDropReturn {
	handleDragEnd: (event: DragEndEvent) => void;
}

function handleMediaDrop(
	data: MediaDragData,
	trackId: string,
	addClip: ReturnType<typeof useTimelineStore.getState>["addClip"],
): void {
	const asset = useMediaStore.getState().assets.find((a) => a.id === data.assetId);
	if (!asset) return;

	const track = useTimelineStore.getState().tracks.find((t) => t.id === trackId);
	if (!track) return;

	const duration = asset.metadata && "duration" in asset.metadata ? asset.metadata.duration : 5;
	const startTime = findInsertPosition(track.clips, 0, duration);

	addClip(trackId, {
		id: generateId(),
		trackId,
		assetId: asset.id,
		name: sanitizeFileName(asset.name),
		startTime,
		duration,
		inPoint: 0,
		outPoint: duration,
	});
}

export function useTimelineDragDrop(): UseTimelineDragDropReturn {
	const addClip = useTimelineStore((s) => s.addClip);
	const moveClip = useTimelineStore((s) => s.moveClip);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over) return;

			const dragData = active.data.current as DragData | undefined;
			const dropTrackId = over.data.current?.trackId as string | undefined;
			if (!dragData || !dropTrackId) return;

			if (dragData.type === DND_TYPES.MEDIA_ITEM) {
				handleMediaDrop(dragData, dropTrackId, addClip);
			} else if (dragData.type === DND_TYPES.TIMELINE_CLIP) {
				if (dragData.trackId !== dropTrackId) {
					moveClip(dragData.trackId, dragData.clipId, dropTrackId, 0);
				}
			}
		},
		[addClip, moveClip],
	);

	return { handleDragEnd };
}
