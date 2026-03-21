import { Pause, Play, Repeat } from "lucide-react";
import { usePlaybackStore } from "@/stores/usePlaybackStore";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/formatDuration";

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4];

export function PlaybackControls() {
	const isPlaying = usePlaybackStore((s) => s.isPlaying);
	const currentTime = usePlaybackStore((s) => s.currentTime);
	const duration = usePlaybackStore((s) => s.duration);
	const speed = usePlaybackStore((s) => s.speed);
	const loopEnabled = usePlaybackStore((s) => s.loopEnabled);
	const togglePlayback = usePlaybackStore((s) => s.togglePlayback);
	const setSpeed = usePlaybackStore((s) => s.setSpeed);
	const toggleLoop = usePlaybackStore((s) => s.toggleLoop);

	return (
		<div className="flex items-center gap-3">
			<button
				type="button"
				onClick={togglePlayback}
				className="flex h-7 w-7 items-center justify-center rounded bg-gray-700 text-white hover:bg-gray-600"
				aria-label={isPlaying ? "정지" : "재생"}
				title={isPlaying ? "정지 (Space)" : "재생 (Space)"}
			>
				{isPlaying ? <Pause size={14} /> : <Play size={14} />}
			</button>

			<span className="font-mono text-xs text-gray-300">{formatDuration(currentTime)}</span>
			<span className="text-xs text-gray-500">/</span>
			<span className="font-mono text-xs text-gray-500">{formatDuration(duration)}</span>

			<select
				value={speed}
				onChange={(e) => setSpeed(Number(e.target.value))}
				className="h-6 rounded bg-gray-700 px-1 text-xs text-gray-300"
				aria-label="재생 속도"
			>
				{SPEED_OPTIONS.map((s) => (
					<option key={s} value={s}>
						{s}x
					</option>
				))}
			</select>

			<button
				type="button"
				onClick={toggleLoop}
				className={cn(
					"flex h-6 w-6 items-center justify-center rounded",
					loopEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600",
				)}
				aria-label={loopEnabled ? "루프 끄기" : "루프 켜기"}
				title={loopEnabled ? "루프 끄기" : "루프 켜기"}
			>
				<Repeat size={12} />
			</button>
		</div>
	);
}
