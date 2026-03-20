import { useCallback, useState } from "react";

interface FileDropHandlers {
	onDragEnter: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
}

interface UseFileDropReturn {
	isDragOver: boolean;
	handlers: FileDropHandlers;
}

export function useFileDrop(onFileDrop: (files: File[]) => void): UseFileDropReturn {
	const [isDragOver, setIsDragOver] = useState(false);

	const onDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const onDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				onFileDrop(files);
			}
		},
		[onFileDrop],
	);

	return {
		isDragOver,
		handlers: { onDragEnter, onDragLeave, onDragOver, onDrop },
	};
}
