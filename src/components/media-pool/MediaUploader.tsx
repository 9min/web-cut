import { useCallback, useRef } from "react";
import { ACCEPT_STRING } from "@/constants/media";
import { useFileDrop } from "@/hooks/useFileDrop";
import { cn } from "@/utils/cn";

interface MediaUploaderProps {
	onFiles: (files: File[]) => void;
}

export function MediaUploader({ onFiles }: MediaUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const { isDragOver, handlers } = useFileDrop(onFiles);

	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				onFiles(Array.from(files));
			}
			if (inputRef.current) {
				inputRef.current.value = "";
			}
		},
		[onFiles],
	);

	return (
		<div
			data-testid="media-uploader"
			className={cn(
				"flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors",
				isDragOver ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500",
			)}
			{...handlers}
		>
			<p className="text-center text-xs text-gray-400">파일을 드래그하거나</p>
			<button
				type="button"
				onClick={handleClick}
				className="rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
			>
				파일 선택
			</button>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT_STRING}
				multiple
				onChange={handleChange}
				className="hidden"
			/>
		</div>
	);
}
