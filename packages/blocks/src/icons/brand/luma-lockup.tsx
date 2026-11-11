/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { LumaLogo } from "./luma-logo";

export type LumaLockupProps = React.ComponentPropsWithoutRef<"svg">;

/**
 * The Luma lockup: the spark mark followed by the wordmark.
 */
export function LumaLockup({ width = "225", height = "53", className, color = "currentColor" }: LumaLockupProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 225 53"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(0 2.5) scale(0.923)">
        <path
          d="M26 2 Q31.5 20.5 50 26 Q31.5 31.5 26 50 Q20.5 31.5 2 26 Q20.5 20.5 26 2 Z"
          fill={color}
        />
        <path
          d="M43.5 0 Q46.7 5.3 52 8.5 Q46.7 11.7 43.5 17 Q40.3 11.7 35 8.5 Q40.3 5.3 43.5 0 Z"
          fill={color}
        />
      </g>
      <text
        x="62"
        y="48"
        fill={color}
        fontFamily="inherit"
        fontSize="58"
        fontWeight="600"
        letterSpacing="-1"
      >
        Luma
      </text>
    </svg>
  );
}
