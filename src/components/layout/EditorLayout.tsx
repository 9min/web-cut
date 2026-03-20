import type { ReactNode } from "react";

interface EditorLayoutProps {
	header: ReactNode;
	sidebar: ReactNode;
	preview: ReactNode;
	timeline: ReactNode;
}

export function EditorLayout({ header, sidebar, preview, timeline }: EditorLayoutProps) {
	return (
		<div className="flex h-screen w-screen flex-col bg-background text-foreground">
			<div className="shrink-0">{header}</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-72 shrink-0 overflow-y-auto border-r border-gray-800">{sidebar}</div>
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="flex-1 overflow-hidden">{preview}</div>
					<div className="h-48 shrink-0 border-t border-gray-800">{timeline}</div>
				</div>
			</div>
		</div>
	);
}
