import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

const TIMELINE_MIN_HEIGHT = 120;
const TIMELINE_DEFAULT_HEIGHT = 192;
const PREVIEW_MIN_HEIGHT = 120;
const RESIZE_HANDLE_HEIGHT = 4;

interface EditorLayoutProps {
	header: ReactNode;
	sidebar: ReactNode;
	preview: ReactNode;
	timeline: ReactNode;
	inspector?: ReactNode;
}

export function EditorLayout({ header, sidebar, preview, timeline, inspector }: EditorLayoutProps) {
	const [timelineHeight, setTimelineHeight] = useState(TIMELINE_DEFAULT_HEIGHT);
	const [containerHeight, setContainerHeight] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	const startYRef = useRef(0);
	const startHeightRef = useRef(0);

	// 컨테이너 높이 추적
	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			if (entry) setContainerHeight(entry.contentRect.height);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const previewHeight = Math.max(PREVIEW_MIN_HEIGHT, containerHeight - timelineHeight);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			draggingRef.current = true;
			startYRef.current = e.clientY;
			startHeightRef.current = timelineHeight;

			const onPointerMove = (me: PointerEvent) => {
				if (!draggingRef.current) return;
				const total = contentRef.current?.clientHeight ?? 0;
				const maxTimeline = total - PREVIEW_MIN_HEIGHT;
				const dy = startYRef.current - me.clientY;
				const newHeight = Math.min(
					maxTimeline,
					Math.max(TIMELINE_MIN_HEIGHT, startHeightRef.current + dy),
				);
				setTimelineHeight(newHeight);
			};

			const onPointerUp = () => {
				draggingRef.current = false;
				document.removeEventListener("pointermove", onPointerMove);
				document.removeEventListener("pointerup", onPointerUp);
			};

			document.addEventListener("pointermove", onPointerMove);
			document.addEventListener("pointerup", onPointerUp);
		},
		[timelineHeight],
	);

	return (
		<div className="flex h-screen w-screen flex-col bg-background text-foreground">
			<div className="shrink-0">{header}</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-72 shrink-0 overflow-y-auto border-r border-gray-800">{sidebar}</div>
				<div ref={contentRef} className="flex-1 overflow-hidden">
					{/* 프리뷰 영역 — 명시적 높이 */}
					<div className="flex overflow-hidden" style={{ height: previewHeight }}>
						<div className="min-h-0 flex-1 overflow-hidden">{preview}</div>
						{inspector && (
							<div className="w-56 shrink-0 overflow-y-auto border-l border-gray-800">
								{inspector}
							</div>
						)}
					</div>
					{/* 타임라인 영역 — 명시적 높이 */}
					<div
						className="relative select-none border-t border-gray-800"
						style={{ height: timelineHeight }}
					>
						<div
							className="absolute inset-x-0 -top-0.5 z-10 cursor-row-resize transition-colors hover:bg-blue-500/50 active:bg-blue-500/70"
							style={{ height: RESIZE_HANDLE_HEIGHT }}
							onPointerDown={handlePointerDown}
							data-testid="timeline-resize-handle"
						/>
						<div className="h-full overflow-hidden">{timeline}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
