import { useDroppable } from "@dnd-kit/core";
import { Lock, Plus, Unlock, Volume2, VolumeX, X } from "lucide-react";
import { memo, type Ref, useCallback, useMemo, useState } from "react";
import { TRACK_HEIGHT } from "@/constants/timeline";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip, Track } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { pixelToTime } from "@/utils/timelineUtils";
import { AddTransitionButton } from "./AddTransitionButton";
import { AudioClipBlock } from "./AudioClipBlock";
import { ClipBlock } from "./ClipBlock";
import { ClipContextMenu } from "./ClipContextMenu";
import { DropIndicator } from "./DropIndicator";
import { SnapIndicator } from "./SnapIndicator";
import { TextClipBlock } from "./TextClipBlock";
import { TransitionBlock } from "./TransitionBlock";

interface TrackRowProps {
	track: Track;
	zoom: number;
	selectedClipIds: Set<string>;
	onSelectClip: (clipId: string) => void;
	dropIndicatorRef?: Ref<HTMLDivElement>;
	snapIndicatorRef?: Ref<HTMLDivElement>;
	onAddTextClip?: (trackId: string, startTime: number) => void;
	onRemoveTrack?: (trackId: string) => void;
	onToggleMuted?: (trackId: string) => void;
	onToggleLocked?: (trackId: string) => void;
}

export const TrackRow = memo(function TrackRow({
	track,
	zoom,
	selectedClipIds,
	onSelectClip,
	dropIndicatorRef,
	snapIndicatorRef,
	onAddTextClip,
	onRemoveTrack,
	onToggleMuted,
	onToggleLocked,
}: TrackRowProps) {
	const [autoOpenClipId, setAutoOpenClipId] = useState<string | null>(null);
	const [contextMenu, setContextMenu] = useState<{
		clipId: string;
		trackId: string;
		x: number;
		y: number;
	} | null>(null);
	const updateTextClip = useTimelineStore((s) => s.updateTextClip);

	const handleContextMenu = useCallback((clipId: string, trackId: string, x: number, y: number) => {
		setContextMenu({ clipId, trackId, x, y });
	}, []);

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
			const ct = usePlaybackStore.getState().currentTime;
			onAddTextClip(track.id, ct);
		}
	}, [onAddTextClip, track.id]);

	return (
		<div data-testid="track-row" className="group/row flex border-b border-gray-800">
			<div className="flex w-28 shrink-0 flex-col justify-center gap-0.5 border-r border-gray-800 px-2 py-1">
				<div className="flex items-center gap-1">
					<span className="min-w-0 flex-1 truncate text-xs text-gray-300">{track.name}</span>
					{onRemoveTrack && (
						<button
							type="button"
							onClick={() => onRemoveTrack(track.id)}
							className="flex shrink-0 items-center justify-center rounded p-0.5 text-gray-500 opacity-0 hover:bg-gray-700 hover:text-red-400 group-hover/row:opacity-100"
							aria-label="트랙 삭제"
							title="트랙 삭제"
							data-testid="remove-track-button"
						>
							<X size={10} />
						</button>
					)}
				</div>
				<div className="flex items-center gap-0.5">
					{onToggleMuted && (
						<button
							type="button"
							onClick={() => onToggleMuted(track.id)}
							className={cn(
								"flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-gray-700",
								track.muted ? "text-yellow-400" : "text-gray-500",
							)}
							aria-label={track.muted ? "뮤트 해제" : "뮤트"}
							title={track.muted ? "뮤트 해제" : "뮤트"}
							data-testid="toggle-mute-button"
						>
							{track.muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
						</button>
					)}
					{onToggleLocked && (
						<button
							type="button"
							onClick={() => onToggleLocked(track.id)}
							className={cn(
								"flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-gray-700",
								track.locked ? "text-red-400" : "text-gray-500",
							)}
							aria-label={track.locked ? "잠금 해제" : "잠금"}
							title={track.locked ? "잠금 해제" : "잠금"}
							data-testid="toggle-lock-button"
						>
							{track.locked ? <Lock size={11} /> : <Unlock size={11} />}
						</button>
					)}
					{isTextTrack && onAddTextClip && (
						<button
							type="button"
							onClick={handleAddTextClipClick}
							className="flex shrink-0 items-center justify-center rounded p-0.5 text-gray-400 hover:bg-gray-700 hover:text-white"
							aria-label="텍스트 클립 추가"
							title="텍스트 클립 추가"
							data-testid="add-text-clip-button"
						>
							<Plus size={11} />
						</button>
					)}
				</div>
			</div>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: 텍스트 트랙 빈 영역 더블클릭으로 클립 생성 */}
			<div
				ref={setNodeRef}
				className={cn(
					"group/track relative flex-1 overflow-visible",
					isOver && "bg-blue-900/20",
					track.muted && "opacity-50",
				)}
				style={{ height: TRACK_HEIGHT }}
				onDoubleClick={isTextTrack ? handleTrackDoubleClick : undefined}
			>
				{isTextTrack ? (
					track.textClips.map((textClip) => (
						<TextClipBlock
							key={textClip.id}
							textClip={textClip}
							zoom={zoom}
							isSelected={selectedClipIds.has(textClip.id)}
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
							isSelected={selectedClipIds.has(clip.id)}
							onSelect={onSelectClip}
							onContextMenu={handleContextMenu}
						/>
					))
				) : (
					<>
						{track.clips.map((clip) => (
							<ClipBlock
								key={clip.id}
								clip={clip}
								zoom={zoom}
								isSelected={selectedClipIds.has(clip.id)}
								onSelect={onSelectClip}
								onContextMenu={handleContextMenu}
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
				<SnapIndicator ref={snapIndicatorRef} />
				{track.locked && (
					<div
						className="pointer-events-none absolute inset-0 bg-gray-900/30"
						data-testid="locked-overlay"
					/>
				)}
			</div>
			{contextMenu && (
				<ClipContextMenu
					clipId={contextMenu.clipId}
					trackId={contextMenu.trackId}
					x={contextMenu.x}
					y={contextMenu.y}
					onClose={() => setContextMenu(null)}
				/>
			)}
		</div>
	);
});
