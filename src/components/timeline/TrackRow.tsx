import { useDroppable } from "@dnd-kit/core";
import { Plus, X } from "lucide-react";
import { type Ref, useCallback, useMemo, useState } from "react";
import { TRACK_HEIGHT } from "@/constants/timeline";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip, Track } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { pixelToTime } from "@/utils/timelineUtils";
import { AddTransitionButton } from "./AddTransitionButton";
import { AudioClipBlock } from "./AudioClipBlock";
import { ClipBlock } from "./ClipBlock";
import { DropIndicator } from "./DropIndicator";
import { TextClipBlock } from "./TextClipBlock";
import { TransitionBlock } from "./TransitionBlock";

interface TrackRowProps {
	track: Track;
	zoom: number;
	selectedClipId: string | null;
	onSelectClip: (clipId: string) => void;
	dropIndicatorRef?: Ref<HTMLDivElement>;
	onAddTextClip?: (trackId: string, startTime: number) => void;
	onRemoveTrack?: (trackId: string) => void;
	currentTime?: number;
}

export function TrackRow({
	track,
	zoom,
	selectedClipId,
	onSelectClip,
	dropIndicatorRef,
	onAddTextClip,
	onRemoveTrack,
	currentTime = 0,
}: TrackRowProps) {
	const [autoOpenClipId, setAutoOpenClipId] = useState<string | null>(null);
	const updateTextClip = useTimelineStore((s) => s.updateTextClip);

	const handleTransitionAdded = useCallback((clipId: string) => {
		setAutoOpenClipId(clipId);
	}, []);

	const { setNodeRef, isOver } = useDroppable({
		id: `track-${track.id}`,
		data: { trackId: track.id, trackType: track.type },
	});

	const sortedClips = useMemo(
		() => [...track.clips].sort((a, b) => a.startTime - b.startTime),
		[track.clips],
	);

	const handleTextClipResize = useCallback(
		(textClipId: string, newDuration: number, newStartTime?: number) => {
			const updates: { duration: number; startTime?: number } = { duration: newDuration };
			if (newStartTime !== undefined) updates.startTime = newStartTime;
			updateTextClip(track.id, textClipId, updates);
		},
		[track.id, updateTextClip],
	);

	const isTextTrack = track.type === "text";

	const handleTrackDoubleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!isTextTrack || !onAddTextClip) return;
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const time = pixelToTime(x, zoom);
			onAddTextClip(track.id, Math.max(0, time));
		},
		[isTextTrack, onAddTextClip, track.id, zoom],
	);

	const handleAddTextClipClick = useCallback(() => {
		if (onAddTextClip) {
			onAddTextClip(track.id, currentTime);
		}
	}, [onAddTextClip, track.id, currentTime]);

	return (
		<div data-testid="track-row" className="group/row flex border-b border-gray-800">
			<div className="flex w-28 shrink-0 items-center gap-1 border-r border-gray-800 px-2">
				<span className="min-w-0 flex-1 truncate text-xs text-gray-300">{track.name}</span>
				{isTextTrack && onAddTextClip && (
					<button
						type="button"
						onClick={handleAddTextClipClick}
						className="flex shrink-0 items-center justify-center rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
						aria-label="텍스트 클립 추가"
						data-testid="add-text-clip-button"
					>
						<Plus size={12} />
					</button>
				)}
				{onRemoveTrack && (
					<button
						type="button"
						onClick={() => onRemoveTrack(track.id)}
						className="flex shrink-0 items-center justify-center rounded p-0.5 text-gray-500 opacity-0 hover:bg-gray-700 hover:text-red-400 group-hover/row:opacity-100"
						aria-label="트랙 삭제"
						data-testid="remove-track-button"
					>
						<X size={12} />
					</button>
				)}
			</div>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: 텍스트 트랙 빈 영역 더블클릭으로 클립 생성 */}
			<div
				ref={setNodeRef}
				className={cn("group/track relative flex-1 overflow-visible", isOver && "bg-blue-900/20")}
				style={{ height: TRACK_HEIGHT }}
				onDoubleClick={isTextTrack ? handleTrackDoubleClick : undefined}
			>
				{isTextTrack ? (
					track.textClips.map((textClip) => (
						<TextClipBlock
							key={textClip.id}
							textClip={textClip}
							zoom={zoom}
							isSelected={textClip.id === selectedClipId}
							onSelect={onSelectClip}
							onResize={handleTextClipResize}
						/>
					))
				) : track.type === "audio" ? (
					track.clips.map((clip) => (
						<AudioClipBlock
							key={clip.id}
							clip={clip}
							zoom={zoom}
							isSelected={clip.id === selectedClipId}
							onSelect={onSelectClip}
						/>
					))
				) : (
					<>
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
									autoOpen={autoOpenClipId === clip.id}
									onPopoverClosed={() => {
										if (autoOpenClipId === clip.id) setAutoOpenClipId(null);
									}}
								/>
							) : (
								<AddTransitionButton
									key={`add-transition-${clip.id}`}
									clip={clip}
									nextClip={nextClip}
									zoom={zoom}
									trackId={track.id}
									onAdded={handleTransitionAdded}
								/>
							);
						})}
					</>
				)}
				<DropIndicator ref={dropIndicatorRef} />
			</div>
		</div>
	);
}
