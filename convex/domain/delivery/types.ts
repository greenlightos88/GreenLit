/**
 * Delivery Rooms and versioned delivery packages (sections 61, 68).
 *
 * A delivered package is a frozen historical artifact: future project changes
 * never alter it. Divergence is reported by impact analysis instead.
 */

import type { CompiledDocument } from "../compiler/types";
import type { QualityGateRun } from "../compiler/gates";
import type { ScreenplayDraft } from "../screenplay/types";

export interface DeliveryPackage {
  id: string;
  projectId: string;
  version: number;
  label: string;
  recipient: string;
  deliveredAt: number;
  /** Frozen copies — never mutated after delivery. */
  documents: CompiledDocument[];
  screenplay?: ScreenplayDraft;
  /** The gate run (including any recorded overrides) that authorized delivery. */
  gateRuns: QualityGateRun[];
  snapshotId: string;
}

export type AccessLevel = "read-only" | "comment-enabled";

export interface DeliveryRoomRecipient {
  name: string;
  email?: string;
  accessLevel: AccessLevel;
}

export interface DeliveryRoom {
  id: string;
  projectId: string;
  packageId: string;
  recipients: DeliveryRoomRecipient[];
  expiresAt?: number;
  downloadPermitted: boolean;
  watermark?: string;
  confidentialityNotice?: string;
  commentPermitted: boolean;
  /** Provenance is stripped from external views unless explicitly included. */
  includeProvenance: boolean;
  createdAt: number;
}

export interface DeliveryAccessEvent {
  roomId: string;
  recipientName: string;
  action: "viewed" | "downloaded" | "commented";
  at: number;
}

let packageCounter = 0;

/**
 * Freeze a set of approved documents into an immutable versioned package.
 * The returned copies are deep clones; later edits to the inputs are inert.
 */
export function createDeliveryPackage(
  input: Omit<DeliveryPackage, "id" | "version" | "deliveredAt" | "documents"> & {
    documents: CompiledDocument[];
    priorVersions?: DeliveryPackage[];
  },
  now: number = Date.now(),
): DeliveryPackage {
  packageCounter += 1;
  const version =
    (input.priorVersions ?? []).reduce((max, p) => Math.max(max, p.version), 0) + 1;
  return {
    id: `delivery-${now}-${packageCounter}`,
    projectId: input.projectId,
    version,
    label: input.label,
    recipient: input.recipient,
    deliveredAt: now,
    documents: structuredClone(input.documents).map((d) => ({
      ...d,
      approvalStatus: "delivered" as const,
    })),
    screenplay: input.screenplay ? structuredClone(input.screenplay) : undefined,
    gateRuns: structuredClone(input.gateRuns),
    snapshotId: input.snapshotId,
  };
}
