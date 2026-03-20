import { memo } from "react";
import type { Clip } from "@/types/timeline";
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

	return (
		<button
			type="button"
			data-testid="clip-block"
			className={cn(
				"absolute top-1 flex h-10 cursor-pointer items-center overflow-hidden rounded px-2 text-xs text-left",
				isSelected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-600 hover:bg-gray-500",
			)}
			style={{ left: `${left}px`, width: `${width}px` }}
			onClick={() => onSelect(clip.id)}
		>
			<span className="truncate text-white">{clip.name}</span>
		</button>
	);
});
