import { useCallback } from "react";
import {
	TRANSFORM_POSITION_MAX,
	TRANSFORM_POSITION_MIN,
	TRANSFORM_POSITION_STEP,
	TRANSFORM_ROTATION_MAX,
	TRANSFORM_ROTATION_MIN,
	TRANSFORM_ROTATION_STEP,
	TRANSFORM_SCALE_MAX,
	TRANSFORM_SCALE_MIN,
	TRANSFORM_SCALE_STEP,
} from "@/constants/transform";
import { useDebouncedSnapshot } from "@/hooks/useDebouncedSnapshot";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { ClipTransform } from "@/types/timeline";

interface TransformPanelProps {
	trackId: string;
	clipId: string;
	transform: ClipTransform;
}

export function TransformPanel({ trackId, clipId, transform }: TransformPanelProps) {
	const updateTransform = useTimelineStore((s) => s.updateTransform);
	const resetTransform = useTimelineStore((s) => s.resetTransform);
	const { scheduleSnapshot } = useDebouncedSnapshot();

	const handleChange = useCallback(
		(partial: Partial<ClipTransform>) => {
			scheduleSnapshot();
			updateTransform(trackId, clipId, partial);
		},
		[trackId, clipId, updateTransform, scheduleSnapshot],
	);

	const handleReset = useCallback(() => {
		useHistoryStore.getState().pushSnapshot();
		resetTransform(trackId, clipId);
	}, [trackId, clipId, resetTransform]);

	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-gray-300">트랜스폼</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">X 위치</span>
					<span className="text-xs tabular-nums text-gray-400">{transform.x}%</span>
				</div>
				<input
					type="range"
					min={TRANSFORM_POSITION_MIN}
					max={TRANSFORM_POSITION_MAX}
					step={TRANSFORM_POSITION_STEP}
					value={transform.x}
					onChange={(e) => handleChange({ x: Number(e.target.value) })}
					className="w-full"
					data-testid="transform-x"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">Y 위치</span>
					<span className="text-xs tabular-nums text-gray-400">{transform.y}%</span>
				</div>
				<input
					type="range"
					min={TRANSFORM_POSITION_MIN}
					max={TRANSFORM_POSITION_MAX}
					step={TRANSFORM_POSITION_STEP}
					value={transform.y}
					onChange={(e) => handleChange({ y: Number(e.target.value) })}
					className="w-full"
					data-testid="transform-y"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">X 스케일</span>
					<span className="text-xs tabular-nums text-gray-400">{transform.scaleX.toFixed(2)}</span>
				</div>
				<input
					type="range"
					min={TRANSFORM_SCALE_MIN}
					max={TRANSFORM_SCALE_MAX}
					step={TRANSFORM_SCALE_STEP}
					value={transform.scaleX}
					onChange={(e) => handleChange({ scaleX: Number(e.target.value) })}
					className="w-full"
					data-testid="transform-scaleX"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">Y 스케일</span>
					<span className="text-xs tabular-nums text-gray-400">{transform.scaleY.toFixed(2)}</span>
				</div>
				<input
					type="range"
					min={TRANSFORM_SCALE_MIN}
					max={TRANSFORM_SCALE_MAX}
					step={TRANSFORM_SCALE_STEP}
					value={transform.scaleY}
					onChange={(e) => handleChange({ scaleY: Number(e.target.value) })}
					className="w-full"
					data-testid="transform-scaleY"
				/>
			</div>

			<div>
				<div className="mb-1 flex items-center justify-between">
					<span className="text-xs text-gray-400">회전</span>
					<span className="text-xs tabular-nums text-gray-400">{transform.rotation}°</span>
				</div>
				<input
					type="range"
					min={TRANSFORM_ROTATION_MIN}
					max={TRANSFORM_ROTATION_MAX}
					step={TRANSFORM_ROTATION_STEP}
					value={transform.rotation}
					onChange={(e) => handleChange({ rotation: Number(e.target.value) })}
					className="w-full"
					data-testid="transform-rotation"
				/>
			</div>

			<button
				type="button"
				className="w-full rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
				onClick={handleReset}
				data-testid="transform-reset-button"
			>
				초기화
			</button>
		</div>
	);
}
