import { memo, useCallback, useState } from "react";
import { DEFAULT_TRANSITION_DURATION } from "@/constants/transition";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { timeToPixel } from "@/utils/timelineUtils";
import { canAddTransition } from "@/utils/transitionUtils";

interface AddTransitionButtonProps {
	clip: Clip;
	nextClip: Clip;
	zoom: number;
	trackId: string;
}

export const AddTransitionButton = memo(function AddTransitionButton({
	clip,
	nextClip,
	zoom,
	trackId,
}: AddTransitionButtonProps) {
	const { addTransition } = useTimelineStore();
	const [hovered, setHovered] = useState(false);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			addTransition(trackId, clip.id, {
				type: "fade",
				duration: DEFAULT_TRANSITION_DURATION,
			});
		},
		[trackId, clip.id, addTransition],
	);

	if (!canAddTransition(clip, nextClip)) return null;

	const clipEnd = clip.startTime + clip.duration;
	const left = timeToPixel(clipEnd, zoom);

	return (
		<div
			className="absolute z-20 -translate-x-1/2"
			style={{ left: `${left}px`, top: "-4px", bottom: "-4px", width: "32px" }}
		>
			<button
				type="button"
				data-testid="add-transition-button"
				className={cn(
					"absolute inset-x-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-all",
					hovered
						? "scale-110 bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-500/30"
						: "bg-gray-600/80 text-gray-300",
				)}
				style={{
					left: "50%",
					transform: `translateX(-50%) translateY(-50%) ${hovered ? "scale(1.1)" : ""}`,
				}}
				onClick={handleClick}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				title="트랜지션 추가"
			>
				<span className="text-sm font-bold leading-none">+</span>
			</button>
		</div>
	);
});
