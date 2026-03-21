import { useDroppable } from "@dnd-kit/core";
import type { Ref } from "react";
import { TRACK_HEIGHT } from "@/constants/timeline";
import type { Track } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { ClipBlock } from "./ClipBlock";
import { DropIndicator } from "./DropIndicator";

interface TrackRowProps {
	track: Track;
	zoom: number;
	selectedClipId: string | null;
	onSelectClip: (clipId: string) => void;
	dropIndicatorRef?: Ref<HTMLDivElement>;
}

export function TrackRow({
	track,
	zoom,
	selectedClipId,
	onSelectClip,
	dropIndicatorRef,
}: TrackRowProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `track-${track.id}`,
		data: { trackId: track.id },
	});

	return (
		<div data-testid="track-row" className="flex border-b border-gray-800">
			<div className="flex w-28 shrink-0 items-center border-r border-gray-800 px-2">
				<span className="truncate text-xs text-gray-300">{track.name}</span>
			</div>
			<div
				ref={setNodeRef}
				className={cn("relative flex-1", isOver && "bg-blue-900/20")}
				style={{ height: TRACK_HEIGHT }}
			>
				{track.clips.map((clip) => (
					<ClipBlock
						key={clip.id}
						clip={clip}
						zoom={zoom}
						isSelected={clip.id === selectedClipId}
						onSelect={onSelectClip}
					/>
				))}
				<DropIndicator ref={dropIndicatorRef} />
			</div>
		</div>
	);
}
