import { memo, useCallback, useRef } from "react";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useZoomStore } from "@/stores/useZoomStore";
import { cn } from "@/utils/cn";

interface TrimHandleProps {
	trackId: string;
	clipId: string;
	edge: "left" | "right";
}

export const TrimHandle = memo(function TrimHandle({ trackId, clipId, edge }: TrimHandleProps) {
	const isDraggingRef = useRef(false);
	const startXRef = useRef(0);
	const snapshotPushedRef = useRef(false);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
		e.preventDefault();
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		isDraggingRef.current = true;
		startXRef.current = e.clientX;
		snapshotPushedRef.current = false;
	}, []);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDraggingRef.current) return;

			if (!snapshotPushedRef.current) {
				useHistoryStore.getState().pushSnapshot("클립 트림");
				snapshotPushedRef.current = true;
			}

			const zoom = useZoomStore.getState().zoom;
			const deltaX = e.clientX - startXRef.current;
			const deltaTime = deltaX / zoom;
			startXRef.current = e.clientX;

			useTimelineStore.getState().trimClipByEdge(trackId, clipId, edge, deltaTime);
		},
		[trackId, clipId, edge],
	);

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (!isDraggingRef.current) return;
		isDraggingRef.current = false;
		const target = e.currentTarget as HTMLElement;
		target.releasePointerCapture(e.pointerId);
	}, []);

	return (
		<div
			data-testid={`trim-handle-${edge}`}
			className={cn(
				"absolute top-0 h-full w-2 cursor-col-resize opacity-0 transition-opacity group-hover:opacity-100",
				"bg-white/30 hover:bg-white/50",
				edge === "left" ? "left-0 rounded-l" : "right-0 rounded-r",
			)}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		/>
	);
});
