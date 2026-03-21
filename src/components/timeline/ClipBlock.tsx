import { useDraggable } from "@dnd-kit/core";
import { memo, useCallback } from "react";
import { DND_TYPES } from "@/types/dnd";
import type { Clip } from "@/types/timeline";
import { clipBlockMap } from "@/utils/clipBlockRefs";
import { cn } from "@/utils/cn";
import { timeToPixel } from "@/utils/timelineUtils";

interface ClipBlockProps {
	clip: Clip;
	zoom: number;
	isSelected: boolean;
	onSelect: (clipId: string) => void;
}

export const ClipBlock = memo(function ClipBlock({
	clip,
	zoom,
	isSelected,
	onSelect,
}: ClipBlockProps) {
	const left = timeToPixel(clip.startTime, zoom);
	const width = timeToPixel(clip.duration, zoom);

	const { setNodeRef, attributes, listeners, isDragging, transform } = useDraggable({
		id: `clip-${clip.id}`,
		data: { type: DND_TYPES.TIMELINE_CLIP, clipId: clip.id, trackId: clip.trackId },
	});

	const combinedRef = useCallback(
		(node: HTMLButtonElement | null) => {
			setNodeRef(node);
			if (node) {
				clipBlockMap.set(clip.id, node);
			} else {
				clipBlockMap.delete(clip.id);
			}
		},
		[setNodeRef, clip.id],
	);

	return (
		<button
			ref={combinedRef}
			type="button"
			data-testid="clip-block"
			className={cn(
				"absolute top-1 flex h-10 cursor-pointer items-center overflow-hidden rounded px-2 text-xs text-left",
				isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-600 hover:bg-gray-500",
				isDragging && "opacity-80 shadow-lg ring-2 ring-blue-500",
			)}
			style={{
				left: `${left}px`,
				width: `${width}px`,
				transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
				transition: isDragging ? undefined : "transform 150ms ease",
				zIndex: isDragging ? 50 : undefined,
			}}
			onClick={() => onSelect(clip.id)}
			{...listeners}
			{...attributes}
		>
			<span className="truncate text-white">{clip.name}</span>
		</button>
	);
});
