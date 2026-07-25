import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const truthStatus = v.union(
  v.literal("canonical"),
  v.literal("creative-direction"),
  v.literal("approved-interpretation"),
  v.literal("production-recommendation"),
  v.literal("speculative"),
  v.literal("unresolved"),
  v.literal("archived-alternative"),
);

const approvalStatus = v.union(
  v.literal("draft"),
  v.literal("awaiting-approval"),
  v.literal("approved"),
  v.literal("delivered"),
);

const staleStatus = v.union(
  v.literal("current"),
  v.literal("potentially-stale"),
  v.literal("stale"),
  v.literal("conflicted"),
  v.literal("missing-required"),
  v.literal("awaiting-approval"),
);

const jobStatus = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("cancelled"),
);

export default defineSchema({
  // Authenticated human identity, keyed by the stable Clerk subject (JWT `sub`).
  // Identity is established by Clerk; authorization is enforced by Convex
  // functions (ADR-0002). External delivery recipients and AI/service agents
  // are NOT users and never appear here.
  users: defineTable({
    subject: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_subject", ["subject"]),

  projects: defineTable({
    title: v.string(),
    format: v.optional(v.string()),
    genre: v.optional(v.string()),
    developmentStatus: v.optional(v.string()),
    currentVersion: v.number(),
    // Owner is optional at the column level so pre-ownership rows stay valid;
    // ownership is enforced in code and an ownerless row is access-denied
    // (ADR-0002 §10.4). A future membership table replaces the ownership check,
    // not this column.
    ownerUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_updated", ["updatedAt"])
    .index("by_owner", ["ownerUserId", "updatedAt"]),

  projectObjects: defineTable({
    projectId: v.id("projects"),
    objectKey: v.string(),
    kind: v.string(),
    name: v.string(),
    version: v.number(),
    truthStatus,
    origin: v.union(
      v.literal("user"),
      v.literal("generated"),
      v.literal("source-quotation"),
    ),
    data: v.any(),
    sourceObjectKeys: v.array(v.string()),
    confidential: v.optional(v.boolean()),
    sequelMaterial: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_kind", ["projectId", "kind"])
    .index("by_project_key", ["projectId", "objectKey"]),

  canonSnapshots: defineTable({
    projectId: v.id("projects"),
    projectVersion: v.number(),
    label: v.optional(v.string()),
    meta: v.any(),
    objects: v.array(v.any()),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),

  documentProfiles: defineTable({
    profileKey: v.string(),
    title: v.string(),
    kind: v.string(),
    intendedAudience: v.string(),
    sectionDefinitions: v.array(v.any()),
    inclusionRules: v.optional(v.any()),
    exclusionRules: v.optional(v.any()),
    defaultConfidentiality: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["profileKey"]),

  compiledDocuments: defineTable({
    sourceProject: v.id("projects"),
    projectVersion: v.number(),
    canonSnapshot: v.id("canonSnapshots"),
    intendedAudience: v.string(),
    compilationProfile: v.string(),
    compilerVersion: v.string(),
    sourceObjects: v.array(v.string()),
    title: v.string(),
    confidentiality: v.string(),
    qualityGateStatus: v.string(),
    approvalStatus,
    // Approver identity is persisted (ADR-0002 §10): approval is the slice's
    // authority-bearing act, so who approved and when are durable, not dropped.
    approvedByUserId: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    exportStatus: v.string(),
    deliveryStatus: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["sourceProject", "createdAt"])
    .index("by_snapshot", ["canonSnapshot"]),

  compiledDocumentSections: defineTable({
    documentId: v.id("compiledDocuments"),
    sectionKey: v.string(),
    sectionType: v.string(),
    title: v.string(),
    order: v.number(),
    structuredData: v.optional(v.any()),
    generatedProse: v.array(v.any()),
    validationStatus: v.string(),
    staleStatus,
    lastCompiledAt: v.number(),
  })
    .index("by_document", ["documentId", "order"])
    .index("by_document_key", ["documentId", "sectionKey"]),

  sectionSources: defineTable({
    sectionId: v.id("compiledDocumentSections"),
    sourceObjectKey: v.string(),
    sourceVersion: v.number(),
    sourceField: v.optional(v.string()),
    origin: v.string(),
    inference: v.boolean(),
  })
    .index("by_section", ["sectionId"])
    .index("by_source", ["sourceObjectKey"]),

  sectionOverrides: defineTable({
    sectionId: v.id("compiledDocumentSections"),
    scope: v.union(
      v.literal("project"),
      v.literal("document"),
      v.literal("formatting"),
    ),
    content: v.any(),
    lockedWording: v.boolean(),
    lockedFacts: v.boolean(),
    note: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  }).index("by_section", ["sectionId", "createdAt"]),

  compilationRuns: defineTable({
    projectId: v.id("projects"),
    snapshotId: v.id("canonSnapshots"),
    documentId: v.optional(v.id("compiledDocuments")),
    profileKey: v.string(),
    compilerVersion: v.string(),
    status: jobStatus,
    requestedBy: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_project", ["projectId", "startedAt"]),

  compilationEvents: defineTable({
    runId: v.id("compilationRuns"),
    type: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_run", ["runId", "createdAt"]),

  compilationWarnings: defineTable({
    runId: v.id("compilationRuns"),
    documentId: v.optional(v.id("compiledDocuments")),
    sectionKey: v.optional(v.string()),
    code: v.string(),
    severity: v.string(),
    issue: v.string(),
    consequence: v.string(),
    proposedFix: v.optional(v.string()),
    affectedDocuments: v.array(v.string()),
    approvalRequired: v.boolean(),
    resolvedAt: v.optional(v.number()),
  }).index("by_run", ["runId"]),

  qualityGateRuns: defineTable({
    documentId: v.id("compiledDocuments"),
    status: v.string(),
    overrides: v.array(v.any()),
    ranAt: v.number(),
  }).index("by_document", ["documentId", "ranAt"]),

  qualityGateResults: defineTable({
    gateRunId: v.id("qualityGateRuns"),
    gate: v.string(),
    status: v.string(),
    findings: v.array(v.string()),
  }).index("by_run", ["gateRunId"]),

  exportJobs: defineTable({
    documentId: v.id("compiledDocuments"),
    format: v.string(),
    status: jobStatus,
    options: v.optional(v.any()),
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_document", ["documentId", "requestedAt"]),

  exportedFiles: defineTable({
    exportJobId: v.id("exportJobs"),
    storageId: v.optional(v.id("_storage")),
    filename: v.string(),
    mediaType: v.string(),
    byteLength: v.number(),
    checksum: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_job", ["exportJobId"]),

  documentTemplates: defineTable({
    templateKey: v.string(),
    name: v.string(),
    profileKey: v.string(),
    brandTreatment: v.any(),
    layoutRules: v.any(),
    version: v.number(),
    createdAt: v.number(),
  }).index("by_key", ["templateKey", "version"]),

  documentVersions: defineTable({
    documentId: v.id("compiledDocuments"),
    version: v.number(),
    snapshotId: v.id("canonSnapshots"),
    frozenDocument: v.any(),
    label: v.string(),
    delivered: v.boolean(),
    createdAt: v.number(),
  }).index("by_document", ["documentId", "version"]),

  documentDependencies: defineTable({
    documentId: v.id("compiledDocuments"),
    sectionId: v.optional(v.id("compiledDocumentSections")),
    sourceObjectKey: v.string(),
    sourceVersion: v.number(),
    dependencyType: v.string(),
  })
    .index("by_document", ["documentId"])
    .index("by_source", ["sourceObjectKey"]),

  deliveryRooms: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    visibleVersion: v.number(),
    accessLevel: v.string(),
    expiresAt: v.optional(v.number()),
    downloadPermission: v.boolean(),
    watermark: v.optional(v.string()),
    commentPermission: v.boolean(),
    confidentialityNotice: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),

  deliveryRoomRecipients: defineTable({
    roomId: v.id("deliveryRooms"),
    name: v.string(),
    email: v.optional(v.string()),
    accessLevel: v.string(),
    revokedAt: v.optional(v.number()),
  }).index("by_room", ["roomId"]),

  deliveryRoomDocuments: defineTable({
    roomId: v.id("deliveryRooms"),
    documentVersionId: v.id("documentVersions"),
    order: v.number(),
  }).index("by_room", ["roomId", "order"]),

  deliveryAccessEvents: defineTable({
    roomId: v.id("deliveryRooms"),
    recipientId: v.optional(v.id("deliveryRoomRecipients")),
    action: v.string(),
    userAgent: v.optional(v.string()),
    occurredAt: v.number(),
  }).index("by_room", ["roomId", "occurredAt"]),

  reviewNotes: defineTable({
    roomId: v.optional(v.id("deliveryRooms")),
    author: v.string(),
    source: v.string(),
    documentVersionId: v.id("documentVersions"),
    page: v.optional(v.number()),
    scene: v.optional(v.string()),
    section: v.optional(v.string()),
    quotedTargetText: v.optional(v.string()),
    note: v.string(),
    category: v.string(),
    severity: v.string(),
    requestedChange: v.optional(v.string()),
    inferredIntent: v.optional(v.string()),
    acceptanceStatus: v.string(),
    response: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_document_version", ["documentVersionId", "createdAt"]),

  reviewNoteTargets: defineTable({
    reviewNoteId: v.id("reviewNotes"),
    objectKey: v.string(),
    field: v.optional(v.string()),
  }).index("by_note", ["reviewNoteId"]),

  reviewDecisions: defineTable({
    reviewNoteId: v.id("reviewNotes"),
    action: v.string(),
    response: v.optional(v.string()),
    resultingDecisionKey: v.optional(v.string()),
    resultingArtifactVersion: v.optional(v.string()),
    decidedBy: v.string(),
    decidedAt: v.number(),
  }).index("by_note", ["reviewNoteId", "decidedAt"]),

  departmentPackets: defineTable({
    projectId: v.id("projects"),
    documentId: v.id("compiledDocuments"),
    department: v.string(),
    status: approvalStatus,
    createdAt: v.number(),
  }).index("by_project_department", ["projectId", "department"]),

  screenplayDrafts: defineTable({
    projectId: v.id("projects"),
    snapshotId: v.id("canonSnapshots"),
    form: v.string(),
    mode: v.string(),
    titlePage: v.any(),
    revisionMetadata: v.any(),
    status: approvalStatus,
    version: v.number(),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "version"]),

  screenplayScenes: defineTable({
    draftId: v.id("screenplayDrafts"),
    sceneObjectKey: v.optional(v.string()),
    sceneNumber: v.optional(v.string()),
    order: v.number(),
    heading: v.any(),
    locked: v.boolean(),
  }).index("by_draft", ["draftId", "order"]),

  screenplayElements: defineTable({
    sceneId: v.id("screenplayScenes"),
    order: v.number(),
    elementType: v.string(),
    text: v.string(),
    metadata: v.optional(v.any()),
    origin: v.string(),
  }).index("by_scene", ["sceneId", "order"]),

  sceneBreakdowns: defineTable({
    screenplaySceneId: v.id("screenplayScenes"),
    narrativePurpose: v.optional(v.string()),
    emotionalPurpose: v.optional(v.string()),
    complexity: v.string(),
    confirmedByProduction: v.boolean(),
    createdAt: v.number(),
  }).index("by_scene", ["screenplaySceneId"]),

  continuityRecords: defineTable({
    projectId: v.id("projects"),
    sceneObjectKey: v.string(),
    category: v.string(),
    subjectObjectKey: v.optional(v.string()),
    state: v.any(),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_project_scene", ["projectId", "sceneObjectKey"]),

  productionRequirements: defineTable({
    projectId: v.id("projects"),
    sceneObjectKey: v.string(),
    category: v.string(),
    department: v.string(),
    evidence: v.string(),
    narrativePurpose: v.optional(v.string()),
    emotionalPurpose: v.optional(v.string()),
    projectLawKeys: v.array(v.string()),
    continuityRequirements: v.array(v.string()),
    unresolvedQuestions: v.array(v.string()),
    confidence: v.string(),
    confirmed: v.boolean(),
    createdAt: v.number(),
  }).index("by_project_scene", ["projectId", "sceneObjectKey"]),

  productionRisks: defineTable({
    projectId: v.id("projects"),
    sceneObjectKey: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    severity: v.string(),
    estimate: v.boolean(),
    mitigation: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "severity"]),

  // --- Idea-to-Canon vertical slice (Implementation Milestone 1) -----------
  // Fragment: preserved source material (CANON.md). Exact source text is never
  // rewritten by interpretation; every fragment is attributable and immutable
  // (no update path; sourceVersion fixes the captured version).
  fragments: defineTable({
    projectId: v.id("projects"),
    text: v.string(),
    sourceType: v.string(),
    createdByUserId: v.id("users"),
    provenance: v.optional(v.any()),
    sourceVersion: v.number(),
    createdAt: v.number(),
  }).index("by_project", ["projectId", "createdAt"]),
});
