import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { useCallback, useRef } from "react";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useMediaStore } from "@/stores/useMediaStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useZoomStore } from "@/stores/useZoomStore";
import type { ClipDragData, DragData, MediaDragData, TextClipDragData } from "@/types/dnd";
import { DND_TYPES } from "@/types/dnd";
import { dropIndicatorMap } from "@/utils/dropIndicatorRefs";
import { generateId } from "@/utils/generateId";
import {
	applyPreviewOffsets,
	clearAllPreviewOffsets,
	computePreviewOffsets,
} from "@/utils/previewOffsets";
import { sanitizeFileName } from "@/utils/sanitizeFileName";
import {
	calculateDropPosition,
	findDropIndex,
	findInsertPosition,
	getStartTimeAtIndex,
	timeToPixel,
} from "@/utils/timelineUtils";

interface UseTimelineDragDropReturn {
	handleDragEnd: (event: DragEndEvent) => void;
	handleDragMove: (event: DragMoveEvent) => void;
	clearIndicator: () => void;
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

	useHistoryStore.getState().pushSnapshot();
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

interface ClipDropContext {
	clip: import("@/types/timeline").Clip;
	otherClips: import("@/types/timeline").Clip[];
	dropTrackId: string;
}

function resolveClipDropContext(data: ClipDragData, dropTrackId: string): ClipDropContext | null {
	const { tracks } = useTimelineStore.getState();
	const fromTrack = tracks.find((t) => t.id === data.trackId);
	const clip = fromTrack?.clips.find((c) => c.id === data.clipId);
	if (!clip) return null;

	const targetTrack = tracks.find((t) => t.id === dropTrackId);
	if (!targetTrack) return null;

	const otherClips = targetTrack.clips.filter((c) => c.id !== clip.id);
	return { clip, otherClips, dropTrackId };
}

function updateIndicator(
	dropTrackId: string,
	prevTrackIdRef: { current: string },
	newStartTime: number,
	zoom: number,
): void {
	// 이전 트랙 인디케이터 숨김
	if (prevTrackIdRef.current && prevTrackIdRef.current !== dropTrackId) {
		const prevEl = dropIndicatorMap.get(prevTrackIdRef.current);
		if (prevEl) prevEl.style.display = "none";
	}
	prevTrackIdRef.current = dropTrackId;

	// 현재 트랙 인디케이터 표시 (세로선)
	const el = dropIndicatorMap.get(dropTrackId);
	if (el) {
		el.style.display = "block";
		el.style.left = `${timeToPixel(newStartTime, zoom)}px`;
	}
}

function handleClipMove(
	data: ClipDragData,
	dropTrackId: string,
	deltaX: number,
	zoom: number,
): void {
	const ctx = resolveClipDropContext(data, dropTrackId);
	if (!ctx) return;

	const isSameTrack = data.trackId === dropTrackId;
	const newStartTime = isSameTrack
		? Math.max(0, ctx.clip.startTime + deltaX / zoom)
		: calculateDropPosition(ctx.clip.startTime, ctx.clip.duration, deltaX, zoom, ctx.otherClips);

	useHistoryStore.getState().pushSnapshot();
	useTimelineStore.getState().insertClipAt(data.trackId, data.clipId, dropTrackId, newStartTime);
}

function handleTextClipMove(
	data: TextClipDragData,
	dropTrackId: string,
	deltaX: number,
	zoom: number,
): void {
	// text → text 트랙 간만 이동 허용
	const { tracks } = useTimelineStore.getState();
	const targetTrack = tracks.find((t) => t.id === dropTrackId);
	if (!targetTrack || targetTrack.type !== "text") return;

	const fromTrack = tracks.find((t) => t.id === data.trackId);
	const textClip = fromTrack?.textClips.find((tc) => tc.id === data.textClipId);
	if (!textClip) return;

	const newStartTime = Math.max(0, textClip.startTime + deltaX / zoom);

	useHistoryStore.getState().pushSnapshot();
	useTimelineStore
		.getState()
		.moveTextClip(data.trackId, data.textClipId, dropTrackId, newStartTime);
}

export function useTimelineDragDrop(): UseTimelineDragDropReturn {
	const addClip = useTimelineStore((s) => s.addClip);
	const prevTrackIdRef = useRef("");

	const clearIndicator = useCallback(() => {
		for (const el of dropIndicatorMap.values()) {
			el.style.display = "none";
		}
		clearAllPreviewOffsets();
		prevTrackIdRef.current = "";
	}, []);

	const handleDragMove = useCallback((event: DragMoveEvent) => {
		const { active, over, delta } = event;
		if (!over) return;

		const dragData = active.data.current as DragData | undefined;
		if (!dragData) return;

		const dropTrackId = over.data.current?.trackId as string | undefined;
		if (!dropTrackId) return;

		if (dragData.type === DND_TYPES.TIMELINE_CLIP) {
			const ctx = resolveClipDropContext(dragData, dropTrackId);
			if (!ctx) return;

			const zoom = useZoomStore.getState().zoom;
			const isSameTrack = dragData.trackId === dropTrackId;

			if (isSameTrack) {
				const rawTime = Math.max(0, ctx.clip.startTime + delta.x / zoom);
				const sorted = [...ctx.otherClips].sort((a, b) => a.startTime - b.startTime);
				const idx = findDropIndex(sorted, rawTime);
				const indicatorPos = getStartTimeAtIndex(sorted, idx);
				updateIndicator(dropTrackId, prevTrackIdRef, indicatorPos, zoom);

				// 실시간 밀림 미리보기
				const offsets = computePreviewOffsets(sorted, idx, ctx.clip.duration, zoom);
				applyPreviewOffsets(offsets);
			} else {
				clearAllPreviewOffsets();
				const newStartTime = calculateDropPosition(
					ctx.clip.startTime,
					ctx.clip.duration,
					delta.x,
					zoom,
					ctx.otherClips,
				);
				updateIndicator(dropTrackId, prevTrackIdRef, newStartTime, zoom);
			}
		} else if (dragData.type === DND_TYPES.TIMELINE_TEXT_CLIP) {
			const { tracks } = useTimelineStore.getState();
			const fromTrack = tracks.find((t) => t.id === dragData.trackId);
			const textClip = fromTrack?.textClips.find((tc) => tc.id === dragData.textClipId);
			if (!textClip) return;

			const zoom = useZoomStore.getState().zoom;
			const newStartTime = Math.max(0, textClip.startTime + delta.x / zoom);
			updateIndicator(dropTrackId, prevTrackIdRef, newStartTime, zoom);
		}
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over, delta } = event;
			if (!over) return;

			const dragData = active.data.current as DragData | undefined;
			const dropTrackId = over.data.current?.trackId as string | undefined;
			if (!dragData || !dropTrackId) return;

			if (dragData.type === DND_TYPES.MEDIA_ITEM) {
				handleMediaDrop(dragData, dropTrackId, addClip);
			} else if (dragData.type === DND_TYPES.TIMELINE_CLIP) {
				const zoom = useZoomStore.getState().zoom;
				handleClipMove(dragData, dropTrackId, delta.x, zoom);
			} else if (dragData.type === DND_TYPES.TIMELINE_TEXT_CLIP) {
				const zoom = useZoomStore.getState().zoom;
				handleTextClipMove(dragData, dropTrackId, delta.x, zoom);
			}
		},
		[addClip],
	);

	return { handleDragEnd, handleDragMove, clearIndicator };
}
