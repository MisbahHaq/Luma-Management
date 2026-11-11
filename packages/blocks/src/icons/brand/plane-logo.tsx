/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentPropsWithoutRef } from "react";

import { LumaLogo } from "./luma-logo";

export type PlaneLogoProps = ComponentPropsWithoutRef<"svg">;

/**
 * @deprecated Renamed to `LumaLogo` — the product brand is Luma now.
 */
export const PlaneLogo = LumaLogo;
