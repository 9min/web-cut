import { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";

export function usePixiApp(containerRef: React.RefObject<HTMLDivElement | null>) {
	const appRef = useRef<Application | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const app = new Application();
		appRef.current = app;

		let cancelled = false;

		app
			.init({
				background: "#000000",
				resizeTo: container,
				antialias: true,
			})
			.then(() => {
				if (cancelled) {
					app.destroy(true);
					return;
				}
				canvasRef.current = app.canvas;
				container.appendChild(app.canvas);
				setReady(true);
			});

		// 컨테이너 크기 변경 시 PixiJS 캔버스도 리사이즈 (100ms 디바운스)
		let resizeTimer: ReturnType<typeof setTimeout> | null = null;
		const ro = new ResizeObserver(() => {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				if (appRef.current) {
					appRef.current.resize();
				}
			}, 100);
		});
		ro.observe(container);

		return () => {
			cancelled = true;
			setReady(false);
			if (resizeTimer) clearTimeout(resizeTimer);
			ro.disconnect();
			if (canvasRef.current?.parentNode) {
				canvasRef.current.parentNode.removeChild(canvasRef.current);
				canvasRef.current = null;
			}
			if (appRef.current) {
				try {
					appRef.current.destroy(true);
				} catch {
					// init 미완료 시 destroy 실패 무시
				}
				appRef.current = null;
			}
		};
	}, [containerRef]);

	return { app: appRef, ready };
}
