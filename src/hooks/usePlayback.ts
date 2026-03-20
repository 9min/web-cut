import { useEffect, useRef } from "react";
import { usePlaybackStore } from "@/stores/usePlaybackStore";

export function usePlayback(): void {
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const isPlaying = usePlaybackStore((s) => s.isPlaying);

	useEffect(() => {
		if (!isPlaying) {
			lastTimeRef.current = 0;
			return;
		}

		const tick = (timestamp: number) => {
			const {
				currentTime,
				duration,
				seek,
				pause,
				isPlaying: playing,
			} = usePlaybackStore.getState();

			if (!playing) return;

			if (lastTimeRef.current === 0) {
				lastTimeRef.current = timestamp;
				rafRef.current = requestAnimationFrame(tick);
				return;
			}

			const delta = (timestamp - lastTimeRef.current) / 1000;
			lastTimeRef.current = timestamp;
			const newTime = currentTime + delta;

			if (newTime >= duration) {
				seek(duration);
				pause();
				return;
			}

			seek(newTime);
			rafRef.current = requestAnimationFrame(tick);
		};

		lastTimeRef.current = 0;
		rafRef.current = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying]);
}
