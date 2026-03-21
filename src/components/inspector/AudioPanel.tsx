import { useCallback } from "react";
import {
	AUDIO_VOLUME_DEFAULT,
	AUDIO_VOLUME_MAX,
	AUDIO_VOLUME_MIN,
	AUDIO_VOLUME_STEP,
} from "@/constants/audio";
import { useTimelineStore } from "@/stores/useTimelineStore";

interface AudioPanelProps {
	trackId: string;
	clipId: string;
	volume: number;
}

export function AudioPanel({ trackId, clipId, volume }: AudioPanelProps) {
	const updateClipVolume = useTimelineStore((s) => s.updateClipVolume);

	const handleVolumeChange = useCallback(
		(value: number) => {
			updateClipVolume(trackId, clipId, value);
		},
		[trackId, clipId, updateClipVolume],
	);

	const handleReset = useCallback(() => {
		updateClipVolume(trackId, clipId, AUDIO_VOLUME_DEFAULT);
	}, [trackId, clipId, updateClipVolume]);

	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-gray-300">오디오</div>
			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">볼륨</span>
					<span className="text-xs tabular-nums text-gray-400">{Math.round(volume * 100)}%</span>
				</div>
				<input
					type="range"
					min={AUDIO_VOLUME_MIN}
					max={AUDIO_VOLUME_MAX}
					step={AUDIO_VOLUME_STEP}
					value={volume}
					onChange={(e) => handleVolumeChange(Number(e.target.value))}
					className="w-full"
					data-testid="audio-volume-slider"
				/>
			</div>
			<button
				type="button"
				className="w-full rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
				onClick={handleReset}
				data-testid="audio-volume-reset"
			>
				초기화
			</button>
		</div>
	);
}
