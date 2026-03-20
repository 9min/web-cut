import { useCallback, useRef } from "react";
import { TIME_RULER_HEIGHT } from "@/constants/timeline";
import { pixelToTime, timeToPixel } from "@/utils/timelineUtils";

interface TimeRulerProps {
	zoom: number;
	duration: number;
	onSeek: (time: number) => void;
	scrollLeft: number;
}

function getTickInterval(zoom: number): number {
	if (zoom >= 200) return 1;
	if (zoom >= 50) return 5;
	return 10;
}

export function TimeRuler({ zoom, duration, onSeek, scrollLeft }: TimeRulerProps) {
	const ref = useRef<HTMLDivElement>(null);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (!ref.current) return;
			const rect = ref.current.getBoundingClientRect();
			const x = e.clientX - rect.left + scrollLeft;
			onSeek(pixelToTime(x, zoom));
		},
		[zoom, onSeek, scrollLeft],
	);

	const totalWidth = timeToPixel(Math.max(duration, 30), zoom);
	const interval = getTickInterval(zoom);
	const tickCount = Math.ceil(Math.max(duration, 30) / interval) + 1;

	return (
		<div
			ref={ref}
			data-testid="time-ruler"
			role="slider"
			tabIndex={0}
			aria-label="타임라인 눈금자"
			aria-valuenow={0}
			className="relative cursor-pointer select-none border-b border-gray-700"
			style={{ height: TIME_RULER_HEIGHT, width: totalWidth }}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "ArrowRight") onSeek(pixelToTime(10 + scrollLeft, zoom));
				if (e.key === "ArrowLeft") onSeek(pixelToTime(Math.max(0, scrollLeft - 10), zoom));
			}}
		>
			{Array.from({ length: tickCount }, (_, i) => {
				const time = i * interval;
				const x = timeToPixel(time, zoom);
				const minutes = Math.floor(time / 60);
				const seconds = time % 60;
				const label = `${minutes}:${String(seconds).padStart(2, "0")}`;
				return (
					<div key={time} className="absolute top-0" style={{ left: x }}>
						<div className="h-2 w-px bg-gray-600" />
						<span className="absolute top-2 -translate-x-1/2 text-[9px] text-gray-500">
							{label}
						</span>
					</div>
				);
			})}
		</div>
	);
}
