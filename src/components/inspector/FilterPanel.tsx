import { useCallback } from "react";
import {
	FILTER_LABELS,
	FILTER_MAX,
	FILTER_MIN,
	FILTER_STEP,
	FILTER_TYPES,
} from "@/constants/filter";
import { useDebouncedSnapshot } from "@/hooks/useDebouncedSnapshot";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { ClipFilter, FilterType } from "@/types/filter";

interface FilterPanelProps {
	trackId: string;
	clipId: string;
	filter: ClipFilter;
}

export function FilterPanel({ trackId, clipId, filter }: FilterPanelProps) {
	const { updateFilter, resetFilter } = useTimelineStore();
	const { scheduleSnapshot } = useDebouncedSnapshot();

	const handleChange = useCallback(
		(type: FilterType, value: number) => {
			scheduleSnapshot();
			updateFilter(trackId, clipId, { [type]: value });
		},
		[trackId, clipId, updateFilter, scheduleSnapshot],
	);

	const handleReset = useCallback(() => {
		useHistoryStore.getState().pushSnapshot();
		resetFilter(trackId, clipId);
	}, [trackId, clipId, resetFilter]);

	return (
		<div className="space-y-3">
			<div className="text-xs font-medium text-gray-300">필터</div>
			{FILTER_TYPES.map((type) => (
				<div key={type}>
					<div className="mb-1 flex items-center justify-between">
						<span className="text-xs text-gray-400">{FILTER_LABELS[type]}</span>
						<span className="text-xs tabular-nums text-gray-400">{filter[type]}</span>
					</div>
					<input
						type="range"
						min={FILTER_MIN}
						max={FILTER_MAX}
						step={FILTER_STEP}
						value={filter[type]}
						onChange={(e) => handleChange(type, Number(e.target.value))}
						className="w-full"
						data-testid={`filter-slider-${type}`}
					/>
				</div>
			))}
			<button
				type="button"
				className="w-full rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
				onClick={handleReset}
				data-testid="filter-reset-button"
			>
				초기화
			</button>
		</div>
	);
}
