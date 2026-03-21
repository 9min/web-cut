import { useCallback, useRef } from "react";
import { useHistoryStore } from "@/stores/useHistoryStore";

const DEBOUNCE_MS = 300;

export function useDebouncedSnapshot() {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const batchActiveRef = useRef(false);

	const scheduleSnapshot = useCallback(() => {
		if (!batchActiveRef.current) {
			batchActiveRef.current = true;
			useHistoryStore.getState().pushSnapshot();
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
