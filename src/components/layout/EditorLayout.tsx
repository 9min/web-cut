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
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	const startYRef = useRef(0);
	const startHeightRef = useRef(0);

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

	const handleToggleSidebar = useCallback(() => {
		setSidebarCollapsed((prev) => !prev);
	}, []);

	return (
		<div className="flex h-screen w-screen flex-col bg-background text-foreground">
			<div className="shrink-0">{header}</div>
			<div className="flex flex-1 overflow-hidden">
				{/* 모바일 사이드바 토글 버튼 */}
				<button
					type="button"
					className="fixed top-12 left-2 z-50 rounded bg-gray-800 p-2 text-gray-300 md:hidden"
					onClick={handleToggleSidebar}
					aria-label={sidebarCollapsed ? "사이드바 열기" : "사이드바 닫기"}
					data-testid="sidebar-toggle"
				>
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: 버튼의 aria-label로 대체 */}
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<rect y="2" width="16" height="2" rx="1" />
						<rect y="7" width="16" height="2" rx="1" />
						<rect y="12" width="16" height="2" rx="1" />
					</svg>
				</button>

				{/* 모바일 사이드바 오버레이 */}
				{sidebarCollapsed && (
					<>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: 오버레이 백드롭 */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: 오버레이 백드롭 */}
						<div
							className="fixed inset-0 z-40 bg-black/50 md:hidden"
							onClick={handleToggleSidebar}
							data-testid="sidebar-backdrop"
						/>
						<div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-gray-800 bg-gray-900 md:hidden">
							{sidebar}
						</div>
					</>
				)}

				{/* 데스크톱 사이드바 */}
				<div className="hidden w-72 shrink-0 overflow-y-auto border-r border-gray-800 md:block">
					{sidebar}
				</div>

				<div ref={contentRef} className="flex-1 overflow-hidden">
					<div className="flex overflow-hidden" style={{ height: previewHeight }}>
						<div className="min-h-0 flex-1 overflow-hidden">{preview}</div>
						{inspector && (
							<div className="hidden w-56 shrink-0 overflow-y-auto border-l border-gray-800 md:block">
								{inspector}
							</div>
						)}
					</div>
					<div
						className="relative select-none border-t border-gray-800"
						style={{ height: timelineHeight }}
					>
						<div
							className="absolute inset-x-0 -top-0.5 z-10 cursor-row-resize transition-colors hover:bg-blue-500/50 active:bg-blue-500/70"
							style={{ height: RESIZE_HANDLE_HEIGHT, padding: "4px 0" }}
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
