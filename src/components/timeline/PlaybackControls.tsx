import { Pause, Play } from "lucide-react";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { formatDuration } from "@/utils/formatDuration";

export function PlaybackControls() {
	const isPlaying = usePlaybackStore((s) => s.isPlaying);
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const duration = usePlaybackStore((s) => s.duration);
	const togglePlayback = usePlaybackStore((s) => s.togglePlayback);

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={togglePlayback}
				className="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-white hover:bg-gray-600"
				aria-label={isPlaying ? "정지" : "재생"}
			>
				{isPlaying ? <Pause size={14} /> : <Play size={14} />}
			</button>
			<span className="font-mono text-xs text-gray-300">{formatDuration(currentTime)}</span>
			<span className="text-xs text-gray-500">/</span>
			<span className="font-mono text-xs text-gray-500">{formatDuration(duration)}</span>
		</div>
	);
}
