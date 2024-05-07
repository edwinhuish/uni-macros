type Space = '' | ' ';
export type RGBColor = `rgb(${number},${Space}${number},${Space}${number})`;
export type RGBAColor = `rgba(${number},${Space}${number},${Space}${number},${Space}${number})`;
export type HEXColor = `#${string}`;
export type ThemeColor = `@${string}`;

export type Color = RGBColor | RGBAColor | HEXColor;
