import type { CSSProperties } from "react";

export type CssVarStyle = CSSProperties & { [name: `--${string}`]: string | number };
