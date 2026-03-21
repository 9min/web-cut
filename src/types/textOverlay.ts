export interface TextOverlay {
	content: string;
	x: number;
	y: number;
	fontSize: number;
	fontColor: string;
	opacity: number;
}

export interface TextClip {
	id: string;
	trackId: string;
	name: string;
	startTime: number;
	duration: number;
	overlay: TextOverlay;
}
