import type { ReactNode } from "react";

interface EditorLayoutProps {
	header: ReactNode;
	sidebar: ReactNode;
	preview: ReactNode;
	timeline: ReactNode;
	inspector?: ReactNode;
}

export function EditorLayout({ header, sidebar, preview, timeline, inspector }: EditorLayoutProps) {
	return (
		<div className="flex h-screen w-screen flex-col bg-background text-foreground">
			<div className="shrink-0">{header}</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-72 shrink-0 overflow-y-auto border-r border-gray-800">{sidebar}</div>
				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="flex flex-1 overflow-hidden">
						<div className="flex-1 overflow-hidden">{preview}</div>
						{inspector && (
							<div className="w-56 shrink-0 overflow-y-auto border-l border-gray-800">
								{inspector}
							</div>
						)}
					</div>
					<div className="h-48 shrink-0 border-t border-gray-800">{timeline}</div>
				</div>
			</div>
		</div>
	);
}
