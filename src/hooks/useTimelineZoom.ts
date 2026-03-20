import { useCallback, useState } from "react";
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from "@/constants/timeline";

const ZOOM_STEP = 20;

function clampZoom(zoom: number): number {
	return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

interface UseTimelineZoomReturn {
	zoom: number;
	zoomIn: () => void;
	zoomOut: () => void;
	setZoom: (zoom: number) => void;
}

export function useTimelineZoom(): UseTimelineZoomReturn {
	const [zoom, setZoomRaw] = useState(DEFAULT_ZOOM);

	const zoomIn = useCallback(() => {
		setZoomRaw((prev) => clampZoom(prev + ZOOM_STEP));
	}, []);

	const zoomOut = useCallback(() => {
		setZoomRaw((prev) => clampZoom(prev - ZOOM_STEP));
	}, []);

	const setZoom = useCallback((value: number) => {
		setZoomRaw(clampZoom(value));
	}, []);

	return { zoom, zoomIn, zoomOut, setZoom };
}
