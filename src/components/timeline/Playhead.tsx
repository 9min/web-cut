interface PlayheadProps {
	position: number;
}

export function Playhead({ position }: PlayheadProps) {
	return (
		<div
			data-testid="playhead"
			className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-red-500"
			style={{ left: `${position}px` }}
		>
			<div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-sm bg-red-500" />
		</div>
	);
}
