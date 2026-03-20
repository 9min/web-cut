import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorKeyboard } from "@/hooks/useEditorKeyboard";
import { usePlayback } from "@/hooks/usePlayback";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { TrackType } from "@/types/timeline";
import { generateId } from "@/utils/generateId";
import { getTimelineDuration, timeToPixel } from "@/utils/timelineUtils";
import { PlaybackControls } from "./PlaybackControls";
import { Playhead } from "./Playhead";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimeRuler } from "./TimeRuler";
import { TrackRow } from "./TrackRow";

export function Timeline() {
	const tracks = useTimelineStore((s) => s.tracks);
	const selectedClipId = useTimelineStore((s) => s.selectedClipId);
	const addTrack = useTimelineStore((s) => s.addTrack);
	const selectClip = useTimelineStore((s) => s.selectClip);
	const splitClip = useTimelineStore((s) => s.splitClip);
	const removeClip = useTimelineStore((s) => s.removeClip);
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const seek = usePlaybackStore((s) => s.seek);
	const setDuration = usePlaybackStore((s) => s.setDuration);
	const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
	const { zoom, zoomIn, zoomOut } = useTimelineZoom();
	const [scrollLeft, setScrollLeft] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	usePlayback();
	useEditorKeyboard();

	const duration = getTimelineDuration(tracks);
	const playheadPosition = timeToPixel(currentTime, zoom);

	useEffect(() => {
		setDuration(duration);
	}, [duration, setDuration]);

	const handleAddTrack = useCallback(() => {
		const { tracks: currentTracks } = useTimelineStore.getState();
		const videoCount = currentTracks.filter((t) => t.type === "video").length;
		const audioCount = currentTracks.filter((t) => t.type === "audio").length;
		const type: TrackType = videoCount <= audioCount ? "video" : "audio";
		const name = type === "video" ? `비디오 ${videoCount + 1}` : `오디오 ${audioCount + 1}`;

		pushSnapshot();
		addTrack({
			id: generateId(),
			name,
			type,
			clips: [],
			muted: false,
			locked: false,
			order: currentTracks.length,
		});
	}, [addTrack, pushSnapshot]);

	const handleSplit = useCallback(() => {
		const time = usePlaybackStore.getState().currentTime;
		const { selectedClipId: clipId, tracks: allTracks } = useTimelineStore.getState();
		if (!clipId) return;
		const track = allTracks.find((t) => t.clips.some((c) => c.id === clipId));
		if (!track) return;
		pushSnapshot();
		splitClip(track.id, clipId, time);
	}, [splitClip, pushSnapshot]);

	const handleDelete = useCallback(() => {
		const { selectedClipId: clipId, tracks: allTracks } = useTimelineStore.getState();
		if (!clipId) return;
		const track = allTracks.find((t) => t.clips.some((c) => c.id === clipId));
		if (!track) return;
		pushSnapshot();
		removeClip(track.id, clipId);
	}, [removeClip, pushSnapshot]);

	const handleScroll = useCallback(() => {
		if (scrollRef.current) {
			setScrollLeft(scrollRef.current.scrollLeft);
		}
	}, []);

	return (
		<div data-testid="timeline" className="flex h-full flex-col bg-gray-900">
			<div className="flex items-center justify-between border-b border-gray-800 px-3 py-1">
				<PlaybackControls />
				<TimelineToolbar
					onAddTrack={handleAddTrack}
					onZoomIn={zoomIn}
					onZoomOut={zoomOut}
					onSplit={handleSplit}
					onDelete={handleDelete}
					zoom={zoom}
					canSplit={!!selectedClipId}
					canDelete={!!selectedClipId}
				/>
			</div>

			{tracks.length === 0 ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-xs text-gray-500">트랙을 추가하여 편집을 시작하세요</p>
				</div>
			) : (
				<div ref={scrollRef} className="relative flex-1 overflow-auto" onScroll={handleScroll}>
					<div className="ml-28">
						<TimeRuler zoom={zoom} duration={duration} onSeek={seek} scrollLeft={scrollLeft} />
					</div>
					<div className="relative">
						<div className="pointer-events-none absolute inset-y-0 left-28">
							<Playhead position={playheadPosition} />
						</div>
						{tracks.map((track) => (
							<TrackRow
								key={track.id}
								track={track}
								zoom={zoom}
								selectedClipId={selectedClipId}
								onSelectClip={selectClip}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
