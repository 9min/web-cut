import { useCallback } from "react";
import { SPEED_DEFAULT, SPEED_MAX, SPEED_MIN, SPEED_PRESETS, SPEED_STEP } from "@/constants/speed";
import { useDebouncedSnapshot } from "@/hooks/useDebouncedSnapshot";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTimelineStore } from "@/stores/useTimelineStore";

interface SpeedPanelProps {
	trackId: string;
	clipId: string;
	speed: number;
}

export function SpeedPanel({ trackId, clipId, speed }: SpeedPanelProps) {
	const { updateClipSpeed } = useTimelineStore();
	const { scheduleSnapshot } = useDebouncedSnapshot("속도 변경");

	const handleChange = useCallback(
		(value: number) => {
			scheduleSnapshot();
			updateClipSpeed(trackId, clipId, value);
		},
		[trackId, clipId, updateClipSpeed, scheduleSnapshot],
	);

	const handleReset = useCallback(() => {
		useHistoryStore.getState().pushSnapshot("속도 초기화");
		updateClipSpeed(trackId, clipId, SPEED_DEFAULT);
	}, [trackId, clipId, updateClipSpeed]);

	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-gray-300">재생 속도</div>
			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">속도</span>
					<span className="text-xs tabular-nums text-gray-400">{speed}x</span>
				</div>
				<input
					type="range"
					min={SPEED_MIN}
					max={SPEED_MAX}
					step={SPEED_STEP}
					value={speed}
					onChange={(e) => handleChange(Number(e.target.value))}
					className="w-full"
					data-testid="speed-slider"
				/>
			</div>
			<div className="flex flex-wrap gap-1">
				{SPEED_PRESETS.map((preset) => (
					<button
						key={preset}
						type="button"
						className={`rounded px-2 py-0.5 text-xs ${
							speed === preset
								? "bg-blue-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
						onClick={() => handleChange(preset)}
						data-testid={`speed-preset-${preset}`}
					>
						{preset}x
					</button>
				))}
			</div>
			<button
				type="button"
				className="w-full rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
				onClick={handleReset}
				data-testid="speed-reset-button"
			>
				초기화
			</button>
		</div>
	);
}
