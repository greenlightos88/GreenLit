# GreenLit Execution Model

## Objective Lifecycle

### 1. Resolve
Restate the creator's requested outcome, constraints, acceptance conditions, and prohibited scope. Resolve ambiguity from repository evidence before asking questions that the repository can answer.

### 2. Retrieve
Read the minimum authoritative material needed to make a correct plan. Search narrowly, expand only when evidence requires it, and record unresolved uncertainty.

### 3. Plan
Split the objective into bounded work packages. Identify dependencies, ownership, write sets, verification, and integration order. Do not delegate work that is cheaper and safer for the lead to perform directly.

### 4. Delegate
Assign specialists using the delegation protocol. Every assignment must include purpose, inputs, allowed paths, prohibited changes, expected output, and proof requirements.

### 5. Implement
Specialists make the smallest coherent change that satisfies their assignment. They stop and escalate when architecture, authority, or scope is uncertain.

### 6. Integrate
The lead reviews diffs and evidence, resolves conflicts, preserves repository conventions, and rejects unsupported claims.

### 7. Verify
Verification is independent from implementation whenever risk justifies it. Run applicable typecheck, tests, lint, build, security, authorization, persistence, and workflow checks.

### 8. Persist
Update durable project state, decisions, limitations, and next actions. Do not rely on chat memory to preserve essential context.

### 9. Report
State exactly what changed, what was proven, what was not proven, and what remains. Never describe planned or partial work as completed.

## Delegation Decision

Delegate only when at least one condition is true:

- the task requires specialized repository knowledge;
- independent investigation can reduce lead-context consumption;
- work packages can proceed without conflicting writes;
- an independent verifier materially improves confidence;
- the result can be returned as concise evidence.

Do not delegate when coordination costs exceed the work, the assignment cannot be bounded, or the specialist would need the entire project context.

## Context Budget

- Prefer file paths, line references, diffs, test output, and decision identifiers over repeated summaries.
- Do not load every governance document into every specialist.
- Give each specialist only the authority and context required for its assignment.
- Summarize completed branches of investigation and release them from active context.
- Start a fresh execution phase when the active context becomes dominated by completed work.

## Failure Handling

A failed check, contradictory source, ambiguous authority, or unsafe migration blocks completion. The responsible role reports the failure with evidence and a recommended next decision. It must not conceal the failure through fallback behavior, fixture substitution, or weakened tests.