import { memo, useCallback, useEffect, useRef, useState } from "react";
import { TRANSITION_LABELS } from "@/constants/transition";
import type { Clip } from "@/types/timeline";
import { cn } from "@/utils/cn";
import { timeToPixel } from "@/utils/timelineUtils";
import { TransitionPopover } from "./TransitionPopover";

interface TransitionBlockProps {
	clip: Clip;
	nextClip: Clip;
	zoom: number;
	trackId: string;
	autoOpen?: boolean;
	onPopoverClosed?: () => void;
}

export const TransitionBlock = memo(function TransitionBlock({
	clip,
	nextClip,
	zoom,
	trackId,
	autoOpen,
	onPopoverClosed,
}: TransitionBlockProps) {
	const [showPopover, setShowPopover] = useState(autoOpen ?? false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleClick = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		setShowPopover((prev) => !prev);
	}, []);

	// 바깥 클릭 시 팝오버 닫기 (Portal 대응)
	useEffect(() => {
		if (!showPopover) return;

		const handleOutsideClick = (e: MouseEvent) => {
			const target = e.target as Node;
			// 버튼 내부 클릭은 무시
			if (buttonRef.current?.contains(target)) return;
			// 팝오버(Portal) 내부 클릭은 무시
			const popoverEl = document.querySelector("[data-testid='transition-popover']");
			if (popoverEl?.contains(target)) return;
			setShowPopover(false);
		};

		document.addEventListener("mousedown", handleOutsideClick);
		return () => document.removeEventListener("mousedown", handleOutsideClick);
	}, [showPopover]);

	const transition = clip.outTransition;
	if (!transition) return null;

	const clipEnd = clip.startTime + clip.duration;
	const centerTime = clipEnd;
	const halfDuration = transition.duration / 2;
	const left = timeToPixel(centerTime - halfDuration, zoom);
	const width = timeToPixel(transition.duration, zoom);
	const label = TRANSITION_LABELS[transition.type];

	return (
		<div className="absolute top-0 h-full" style={{ left: `${left}px`, width: `${width}px` }}>
			<button
				ref={buttonRef}
				type="button"
				data-testid="transition-block"
				className={cn(
					"absolute inset-x-0 top-1 h-10 rounded border-2 border-dashed border-yellow-400/60",
					"bg-gradient-to-r from-yellow-500/20 to-yellow-500/30",
					"flex cursor-pointer items-center justify-center",
					"hover:border-yellow-400 hover:from-yellow-500/30 hover:to-yellow-500/40",
					"z-10",
				)}
				onClick={handleClick}
			>
				<span className="truncate text-[10px] text-yellow-300">{label}</span>
			</button>
			{showPopover && (
				<TransitionPopover
					clip={clip}
					nextClip={nextClip}
					trackId={trackId}
					anchorRef={buttonRef}
					onClose={() => {
						setShowPopover(false);
						onPopoverClosed?.();
					}}
				/>
			)}
		</div>
	);
});
