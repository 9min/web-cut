import { forwardRef } from "react";

export const DropIndicator = forwardRef<HTMLDivElement>((_props, ref) => (
	<div
		ref={ref}
		className="pointer-events-none absolute top-0 h-full w-0.5 bg-blue-400"
		style={{ display: "none" }}
	/>
));

DropIndicator.displayName = "DropIndicator";
