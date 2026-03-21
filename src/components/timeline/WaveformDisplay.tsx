import { memo, useEffect, useRef, useState } from "react";
import { loadWaveformPeaks } from "@/services/waveformService";

interface WaveformDisplayProps {
	assetId: string;
	url: string;
	width: number;
	height: number;
}

const BAR_WIDTH = 2;
const BAR_GAP = 1;

export const WaveformDisplay = memo(function WaveformDisplay({
	assetId,
	url,
	width,
	height,
}: WaveformDisplayProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [peaks, setPeaks] = useState<Float32Array | null>(null);

	const numBars = Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP)));

	useEffect(() => {
		let cancelled = false;
		loadWaveformPeaks(assetId, url, numBars)
			.then((data) => {
				if (!cancelled) setPeaks(data);
			})
			.catch(() => {
				// 파형 로드 실패는 무시
			});
		return () => {
			cancelled = true;
		};
	}, [assetId, url, numBars]);

	useEffect(() => {
		if (!peaks || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = width;
		canvas.height = height;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "rgba(74, 222, 128, 0.6)"; // green-400/60%

		for (let i = 0; i < peaks.length; i++) {
			const peak = peaks[i] ?? 0;
			const barHeight = Math.max(1, peak * height);
			const x = i * (BAR_WIDTH + BAR_GAP);
			const y = (height - barHeight) / 2;
			ctx.fillRect(x, y, BAR_WIDTH, barHeight);
		}
	}, [peaks, width, height]);

	return (
		<canvas
			ref={canvasRef}
			className="pointer-events-none absolute inset-0"
			style={{ width, height }}
		/>
	);
});
