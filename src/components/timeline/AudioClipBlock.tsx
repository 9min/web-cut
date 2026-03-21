import { useDraggable } from "@dnd-kit/core";
import { memo, useCallback } from "react";
import { useMediaStore } from "@/stores/useMediaStore";
import { DND_TYPES } from "@/types/dnd";
import type { Clip } from "@/types/timeline";
import { clipBlockMap } from "@/utils/clipBlockRefs";
import { cn } from "@/utils/cn";
import { timeToPixel } from "@/utils/timelineUtils";
import { TrimHandle } from "./TrimHandle";
import { WaveformDisplay } from "./WaveformDisplay";

interface AudioClipBlockProps {
	clip: Clip;
	zoom: number;
	isSelected: boolean;
	onSelect: (clipId: string) => void;
	onContextMenu?: (clipId: string, trackId: string, x: number, y: number) => void;
}

export const AudioClipBlock = memo(function AudioClipBlock({
	clip,
	zoom,
	isSelected,
	onSelect,
	onContextMenu: onCtxMenu,
}: AudioClipBlockProps) {
	const asset = useMediaStore((s) => s.assets.find((a) => a.id === clip.assetId));
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
			data-testid="audio-clip-block"
			className={cn(
				"group absolute top-1 flex h-10 cursor-pointer items-center overflow-hidden rounded px-2 text-xs text-left",
				isSelected ? "bg-green-600 ring-2 ring-green-400" : "bg-green-800 hover:bg-green-700",
				isDragging && "opacity-80 shadow-lg ring-2 ring-green-500",
			)}
			style={{
				left: `${left}px`,
				width: `${width}px`,
				transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
				transition: isDragging ? undefined : "transform 150ms ease",
				zIndex: isDragging ? 50 : undefined,
			}}
			onClick={() => onSelect(clip.id)}
			onContextMenu={(e) => {
				e.preventDefault();
				onCtxMenu?.(clip.id, clip.trackId, e.clientX, e.clientY);
			}}
			{...listeners}
			{...attributes}
		>
			{asset && (
				<WaveformDisplay assetId={clip.assetId} url={asset.objectUrl} width={width} height={40} />
			)}
			<TrimHandle trackId={clip.trackId} clipId={clip.id} edge="left" />
			<span className="relative z-10 truncate text-white">{clip.name}</span>
			<TrimHandle trackId={clip.trackId} clipId={clip.id} edge="right" />
		</button>
	);
});
