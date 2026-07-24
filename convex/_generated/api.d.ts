/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as compilerPersistence from "../compilerPersistence.js";
import type * as domain_compiler_breakdown from "../domain/compiler/breakdown.js";
import type * as domain_compiler_builders from "../domain/compiler/builders.js";
import type * as domain_compiler_compose from "../domain/compiler/compose.js";
import type * as domain_compiler_gates from "../domain/compiler/gates.js";
import type * as domain_compiler_production from "../domain/compiler/production.js";
import type * as domain_compiler_profiles from "../domain/compiler/profiles.js";
import type * as domain_compiler_sections from "../domain/compiler/sections.js";
import type * as domain_compiler_staleness from "../domain/compiler/staleness.js";
import type * as domain_compiler_types from "../domain/compiler/types.js";
import type * as domain_delivery_reviewNotes from "../domain/delivery/reviewNotes.js";
import type * as domain_delivery_types from "../domain/delivery/types.js";
import type * as domain_graph_canon from "../domain/graph/canon.js";
import type * as domain_graph_types from "../domain/graph/types.js";
import type * as domain_screenplay_compile from "../domain/screenplay/compile.js";
import type * as domain_screenplay_fdx from "../domain/screenplay/fdx.js";
import type * as domain_screenplay_fountain from "../domain/screenplay/fountain.js";
import type * as domain_screenplay_types from "../domain/screenplay/types.js";
import type * as domain_screenplay_validate from "../domain/screenplay/validate.js";
import type * as exports from "../exports.js";
import type * as identity from "../identity.js";
import type * as projects from "../projects.js";
import type * as quality from "../quality.js";
import type * as reviews from "../reviews.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  compilerPersistence: typeof compilerPersistence;
  "domain/compiler/breakdown": typeof domain_compiler_breakdown;
  "domain/compiler/builders": typeof domain_compiler_builders;
  "domain/compiler/compose": typeof domain_compiler_compose;
  "domain/compiler/gates": typeof domain_compiler_gates;
  "domain/compiler/production": typeof domain_compiler_production;
  "domain/compiler/profiles": typeof domain_compiler_profiles;
  "domain/compiler/sections": typeof domain_compiler_sections;
  "domain/compiler/staleness": typeof domain_compiler_staleness;
  "domain/compiler/types": typeof domain_compiler_types;
  "domain/delivery/reviewNotes": typeof domain_delivery_reviewNotes;
  "domain/delivery/types": typeof domain_delivery_types;
  "domain/graph/canon": typeof domain_graph_canon;
  "domain/graph/types": typeof domain_graph_types;
  "domain/screenplay/compile": typeof domain_screenplay_compile;
  "domain/screenplay/fdx": typeof domain_screenplay_fdx;
  "domain/screenplay/fountain": typeof domain_screenplay_fountain;
  "domain/screenplay/types": typeof domain_screenplay_types;
  "domain/screenplay/validate": typeof domain_screenplay_validate;
  exports: typeof exports;
  identity: typeof identity;
  projects: typeof projects;
  quality: typeof quality;
  reviews: typeof reviews;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
