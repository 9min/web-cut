import { forwardRef } from "react";

export const SnapIndicator = forwardRef<HTMLDivElement>((_props, ref) => (
	<div
		ref={ref}
		className="pointer-events-none absolute top-0 h-full w-0.5 bg-yellow-400"
		style={{ display: "none" }}
	/>
));

SnapIndicator.displayName = "SnapIndicator";
