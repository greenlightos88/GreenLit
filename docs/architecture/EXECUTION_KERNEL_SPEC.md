# Execution Kernel Specification v1

This specification defines the single execution lifecycle for every creator interaction.

## Core invariant
Every interaction is normalized into a typed ExecutionRequest.

Pipeline:
Intent -> Context Assembly -> Capability Routing -> Tool Execution -> Verification -> Persistence -> UI Update.

## Contracts
- ExecutionRequest
- ExecutionContext
- ExecutionPlan
- ExecutionResult

## Rules
- No model writes Canon directly.
- All durable writes occur through approved persistence services.
- Verification precedes completion.
- Every execution is attributable and auditable.
- Context is assembled on demand, never by loading the entire project.

## Failure handling
Requests fail with structured reasons, preserve partial evidence, and never silently mutate Canon.

## Relationship to existing architecture
This specification refines the Kernel responsibilities and does not supersede repository governance or constitutional authority.