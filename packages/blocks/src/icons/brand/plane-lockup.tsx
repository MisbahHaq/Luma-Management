/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ComponentPropsWithoutRef } from "react";

import { LumaLockup } from "./luma-lockup";

export type PlaneLockupProps = ComponentPropsWithoutRef<"svg">;

/**
 * @deprecated Renamed to `LumaLockup` — the product brand is Luma now.
 */
export const PlaneLockup = LumaLockup;
