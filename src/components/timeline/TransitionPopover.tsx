import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	MAX_TRANSITION_DURATION,
	MIN_TRANSITION_DURATION,
	TRANSITION_LABELS,
	TRANSITION_TYPES,
} from "@/constants/transition";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { Clip } from "@/types/timeline";
import type { TransitionType } from "@/types/transition";
import { validateTransitionDuration } from "@/utils/transitionUtils";

interface TransitionPopoverProps {
	clip: Clip;
	nextClip: Clip;
	trackId: string;
	anchorRef: React.RefObject<HTMLElement | null>;
	onClose: () => void;
}

function usePopoverPosition(anchorRef: React.RefObject<HTMLElement | null>) {
	const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", opacity: 0 });
	const popoverRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const anchor = anchorRef.current;
		const popover = popoverRef.current;
		if (!anchor || !popover) return;

		const update = () => {
			const rect = anchor.getBoundingClientRect();
			const popoverHeight = popover.offsetHeight;
			const popoverWidth = popover.offsetWidth;

			// 기본: 블록 위에 표시
			let top = rect.top - popoverHeight - 4;
			let left = rect.left + rect.width / 2 - popoverWidth / 2;

			// 상단 공간 부족 시 아래로 전환
			if (top < 8) {
				top = rect.bottom + 4;
			}

			// 좌우 화면 밖 보정
			if (left < 8) left = 8;
			if (left + popoverWidth > window.innerWidth - 8) {
				left = window.innerWidth - popoverWidth - 8;
			}

			setStyle({ position: "fixed", top, left, opacity: 1 });
		};

		update();

		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [anchorRef]);

	return { style, popoverRef };
}

export function TransitionPopover({
	clip,
	nextClip,
	trackId,
	anchorRef,
	onClose,
}: TransitionPopoverProps) {
	const { updateTransition, removeTransition } = useTimelineStore();
	const transition = clip.outTransition;
	const { style, popoverRef } = usePopoverPosition(anchorRef);

	const handleTypeChange = useCallback(
		(type: TransitionType) => {
			updateTransition(trackId, clip.id, { type });
		},
		[trackId, clip, updateTransition],
	);

	const handleDurationChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = Number.parseFloat(e.target.value);
			const validated = validateTransitionDuration(clip, nextClip, raw);
			updateTransition(trackId, clip.id, { duration: validated });
		},
		[trackId, clip, nextClip, updateTransition],
	);

	const handleDelete = useCallback(() => {
		removeTransition(trackId, clip.id);
		onClose();
	}, [trackId, clip, removeTransition, onClose]);

	if (!transition) return null;

	const maxDuration = Math.min(MAX_TRANSITION_DURATION, Math.min(clip.duration, nextClip.duration));

	return createPortal(
		<div
			ref={popoverRef}
			role="dialog"
			data-testid="transition-popover"
			className="z-50 w-52 rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-xl"
			style={style}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div className="mb-2 text-xs font-medium text-gray-300">트랜지션 타입</div>
			<div className="mb-3 grid grid-cols-2 gap-1">
				{TRANSITION_TYPES.map((type) => (
					<button
						key={type}
						type="button"
						className={`rounded px-2 py-1 text-xs ${
							transition.type === type
								? "bg-blue-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
						onClick={() => handleTypeChange(type)}
					>
						{TRANSITION_LABELS[type]}
					</button>
				))}
			</div>

			<div className="mb-1 text-xs font-medium text-gray-300">
				지속 시간: {transition.duration.toFixed(1)}초
			</div>
			<input
				type="range"
				min={MIN_TRANSITION_DURATION}
				max={maxDuration}
				step={0.1}
				value={transition.duration}
				onChange={handleDurationChange}
				className="mb-3 w-full"
			/>

			<button
				type="button"
				className="w-full rounded bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-600"
				onClick={handleDelete}
			>
				삭제
			</button>
		</div>,
		document.body,
	);
}
