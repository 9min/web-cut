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
				speed,
				loopEnabled,
				loopIn,
				loopOut,
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

			const delta = ((timestamp - lastTimeRef.current) / 1000) * speed;
			lastTimeRef.current = timestamp;
			const newTime = currentTime + delta;

			// 루프 처리
			if (loopEnabled && loopOut > loopIn) {
				if (newTime >= loopOut) {
					seek(loopIn);
					rafRef.current = requestAnimationFrame(tick);
					return;
				}
			}

			if (duration > 0 && newTime >= duration) {
				if (loopEnabled) {
					seek(loopIn);
					rafRef.current = requestAnimationFrame(tick);
					return;
				}
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
