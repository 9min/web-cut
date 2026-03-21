import { useDraggable } from "@dnd-kit/core";
import { memo, useCallback, useRef } from "react";
import { DND_TYPES } from "@/types/dnd";
import type { TextClip } from "@/types/textOverlay";
import { cn } from "@/utils/cn";
import { timeToPixel } from "@/utils/timelineUtils";

interface TextClipBlockProps {
	textClip: TextClip;
	zoom: number;
	isSelected: boolean;
	onSelect: (clipId: string) => void;
	onResize: (textClipId: string, newDuration: number, newStartTime?: number) => void;
}

export const TextClipBlock = memo(function TextClipBlock({
	textClip,
	zoom,
	isSelected,
	onSelect,
	onResize,
}: TextClipBlockProps) {
	const left = timeToPixel(textClip.startTime, zoom);
	const width = timeToPixel(textClip.duration, zoom);
	const resizingRef = useRef(false);

	const { setNodeRef, attributes, listeners, isDragging, transform } = useDraggable({
		id: `text-clip-${textClip.id}`,
		data: {
			type: DND_TYPES.TIMELINE_TEXT_CLIP,
			textClipId: textClip.id,
			trackId: textClip.trackId,
		},
	});

	const handleLeftResize = useCallback(
		(e: React.PointerEvent) => {
			e.stopPropagation();
			resizingRef.current = true;
			const startX = e.clientX;
			const origStart = textClip.startTime;
			const origDuration = textClip.duration;

			const onMove = (me: PointerEvent) => {
				const dx = me.clientX - startX;
				const dt = dx / zoom;
				const newStart = Math.max(0, origStart + dt);
				const newDuration = Math.max(0.5, origDuration - (newStart - origStart));
				onResize(textClip.id, newDuration, newStart);
			};

			const onUp = () => {
				resizingRef.current = false;
				document.removeEventListener("pointermove", onMove);
				document.removeEventListener("pointerup", onUp);
			};

			document.addEventListener("pointermove", onMove);
			document.addEventListener("pointerup", onUp);
		},
		[textClip.id, textClip.startTime, textClip.duration, zoom, onResize],
	);

	const handleRightResize = useCallback(
		(e: React.PointerEvent) => {
			e.stopPropagation();
			resizingRef.current = true;
			const startX = e.clientX;
			const origDuration = textClip.duration;

			const onMove = (me: PointerEvent) => {
				const dx = me.clientX - startX;
				const dt = dx / zoom;
				const newDuration = Math.max(0.5, origDuration + dt);
				onResize(textClip.id, newDuration);
			};

			const onUp = () => {
				resizingRef.current = false;
				document.removeEventListener("pointermove", onMove);
				document.removeEventListener("pointerup", onUp);
			};

			document.addEventListener("pointermove", onMove);
			document.addEventListener("pointerup", onUp);
		},
		[textClip.id, textClip.duration, zoom, onResize],
	);

	return (
		<button
			ref={setNodeRef}
			type="button"
			data-testid="text-clip-block"
			className={cn(
				"absolute top-1 flex h-10 cursor-pointer items-center overflow-hidden rounded px-2 text-xs text-left",
				isSelected ? "bg-amber-600 ring-2 ring-amber-400" : "bg-amber-700 hover:bg-amber-600",
				isDragging && "opacity-80 shadow-lg ring-2 ring-amber-500",
			)}
			style={{
				left: `${left}px`,
				width: `${width}px`,
				transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
				transition: isDragging ? undefined : "transform 150ms ease",
				zIndex: isDragging ? 50 : undefined,
			}}
			onClick={() => onSelect(textClip.id)}
			{...listeners}
			{...attributes}
		>
			{/* 왼쪽 리사이즈 핸들 */}
			<div
				className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-amber-400/50"
				onPointerDown={handleLeftResize}
				data-testid="text-clip-resize-left"
			/>
			<span className="truncate text-white">{textClip.overlay.content || textClip.name}</span>
			{/* 오른쪽 리사이즈 핸들 */}
			<div
				className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-amber-400/50"
				onPointerDown={handleRightResize}
				data-testid="text-clip-resize-right"
			/>
		</button>
	);
});
