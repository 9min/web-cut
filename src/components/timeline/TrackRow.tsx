import { useDroppable } from "@dnd-kit/core";
import { type Ref, useMemo } from "react";
import { TRACK_HEIGHT } from "@/constants/timeline";
import type { Clip, Track } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { AddTransitionButton } from "./AddTransitionButton";
import { ClipBlock } from "./ClipBlock";
import { DropIndicator } from "./DropIndicator";
import { TransitionBlock } from "./TransitionBlock";

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

	const sortedClips = useMemo(
		() => [...track.clips].sort((a, b) => a.startTime - b.startTime),
		[track.clips],
	);

	return (
		<div data-testid="track-row" className="flex border-b border-gray-800">
			<div className="flex w-28 shrink-0 items-center border-r border-gray-800 px-2">
				<span className="truncate text-xs text-gray-300">{track.name}</span>
			</div>
			<div
				ref={setNodeRef}
				className={cn("group/track relative flex-1 overflow-visible", isOver && "bg-blue-900/20")}
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
				{sortedClips.map((clip, i) => {
					const nextClip = sortedClips[i + 1] as Clip | undefined;
					if (!nextClip) return null;

					return clip.outTransition ? (
						<TransitionBlock
							key={`transition-${clip.id}`}
							clip={clip}
							nextClip={nextClip}
							zoom={zoom}
							trackId={track.id}
						/>
					) : (
						<AddTransitionButton
							key={`add-transition-${clip.id}`}
							clip={clip}
							nextClip={nextClip}
							zoom={zoom}
							trackId={track.id}
						/>
					);
				})}
				<DropIndicator ref={dropIndicatorRef} />
			</div>
		</div>
	);
}
