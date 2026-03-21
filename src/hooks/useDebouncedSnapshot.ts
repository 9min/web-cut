import { useCallback, useEffect, useRef } from "react";
import { useHistoryStore } from "@/stores/useHistoryStore";

const DEBOUNCE_MS = 300;

export function useDebouncedSnapshot(label = "속성 변경") {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const batchActiveRef = useRef(false);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
				batchActiveRef.current = false;
			}
		};
	}, []);

	const scheduleSnapshot = useCallback(() => {
		if (!batchActiveRef.current) {
			batchActiveRef.current = true;
			useHistoryStore.getState().pushSnapshot(label);
		}

		if (timerRef.current) {
			clearTimeout(timerRef.current);
		}

		timerRef.current = setTimeout(() => {
			batchActiveRef.current = false;
			timerRef.current = null;
		}, DEBOUNCE_MS);
	}, []);

	return { scheduleSnapshot };
}
