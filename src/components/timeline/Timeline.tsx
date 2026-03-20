import { useCallback, useRef, useState } from "react";
import { usePlayback } from "@/hooks/usePlayback";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";
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
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const seek = usePlaybackStore((s) => s.seek);
	const { zoom, zoomIn, zoomOut } = useTimelineZoom();
	const [scrollLeft, setScrollLeft] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);

	usePlayback();

	const duration = getTimelineDuration(tracks);
	const playheadPosition = timeToPixel(currentTime, zoom);

	const handleAddTrack = useCallback(() => {
		const videoCount = tracks.filter((t) => t.type === "video").length;
		const audioCount = tracks.filter((t) => t.type === "audio").length;
		const type: TrackType = videoCount <= audioCount ? "video" : "audio";
		const name = type === "video" ? `비디오 ${videoCount + 1}` : `오디오 ${audioCount + 1}`;

		addTrack({
			id: generateId(),
			name,
			type,
			clips: [],
			muted: false,
			locked: false,
			order: tracks.length,
		});
	}, [tracks, addTrack]);

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
					zoom={zoom}
				/>
			</div>

			{tracks.length === 0 ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-xs text-gray-500">트랙을 추가하여 편집을 시작하세요</p>
				</div>
			) : (
				<div ref={scrollRef} className="relative flex-1 overflow-auto" onScroll={handleScroll}>
					<TimeRuler zoom={zoom} duration={duration} onSeek={seek} scrollLeft={scrollLeft} />
					<div className="relative">
						<Playhead position={playheadPosition} />
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
