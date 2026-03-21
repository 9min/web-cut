import { useCallback, useMemo, useRef } from "react";
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

const BUFFER_PX = 100;

export function TimeRuler({ zoom, duration, onSeek, scrollLeft }: TimeRulerProps) {
	const ref = useRef<HTMLDivElement>(null);

	const getTimeFromEvent = useCallback(
		(clientX: number) => {
			if (!ref.current) return 0;
			const rect = ref.current.getBoundingClientRect();
			const x = clientX - rect.left + scrollLeft;
			return pixelToTime(Math.max(0, x), zoom);
		},
		[zoom, scrollLeft],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (!ref.current) return;
			e.preventDefault();
			ref.current.setPointerCapture(e.pointerId);
			onSeek(getTimeFromEvent(e.clientX));
		},
		[onSeek, getTimeFromEvent],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!ref.current?.hasPointerCapture(e.pointerId)) return;
			onSeek(getTimeFromEvent(e.clientX));
		},
		[onSeek, getTimeFromEvent],
	);

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (ref.current?.hasPointerCapture(e.pointerId)) {
			ref.current.releasePointerCapture(e.pointerId);
		}
	}, []);

	const totalWidth = timeToPixel(Math.max(duration, 30), zoom);
	const interval = getTickInterval(zoom);

	const ticks = useMemo(() => {
		const tickCount = Math.ceil(Math.max(duration, 30) / interval) + 1;
		return Array.from({ length: tickCount }, (_, i) => {
			const time = i * interval;
			const x = timeToPixel(time, zoom);
			const minutes = Math.floor(time / 60);
			const seconds = time % 60;
			const label = `${minutes}:${String(seconds).padStart(2, "0")}`;
			return { time, x, label };
		});
	}, [zoom, duration, interval]);

	const viewportWidth = ref.current?.parentElement?.clientWidth ?? 1200;
	const visibleMin = scrollLeft - BUFFER_PX;
	const visibleMax = scrollLeft + viewportWidth + BUFFER_PX;

	const visibleTicks = ticks.filter((t) => t.x >= visibleMin && t.x <= visibleMax);

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
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onKeyDown={(e) => {
				if (e.key === "ArrowRight") onSeek(pixelToTime(10 + scrollLeft, zoom));
				if (e.key === "ArrowLeft") onSeek(pixelToTime(Math.max(0, scrollLeft - 10), zoom));
			}}
		>
			{visibleTicks.map(({ time, x, label }) => (
				<div key={time} className="absolute top-0" style={{ left: x }}>
					<div className="h-2 w-px bg-gray-600" />
					<span className="absolute top-2 -translate-x-1/2 text-[9px] text-gray-500">{label}</span>
				</div>
			))}
		</div>
	);
}
