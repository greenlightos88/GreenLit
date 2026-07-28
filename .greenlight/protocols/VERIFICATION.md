# Verification Protocol

## Principle

Completion is a claim that requires evidence. Passing one check does not prove the entire workflow.

## Verification Layers

1. **Static integrity:** types, lint, formatting, schema and generated-code consistency.
2. **Behavior:** focused tests and end-to-end workflow execution.
3. **Authority:** authentication, authorization, authorship, tenant and creator boundaries.
4. **Persistence:** writes, reads, migrations, retries, and immutable-history behavior.
5. **Product invariants:** canon, candidate, snapshot, compilation, and artifact rules remain intact.
6. **Operational integrity:** build, environment assumptions, fixture boundaries, and failure behavior.

## Evidence Standard

For every applicable check record:

- exact command or inspection performed;
- pass, fail, or not run;
- relevant output or file reference;
- reason for anything not run;
- remaining risk.

A verifier must not weaken a test, substitute fixture state for production behavior, or repair implementation while presenting itself as independent. Failures return to the lead for reassignment.

## Completion Gate

The lead may declare completion only when requested acceptance conditions are satisfied, all applicable checks pass, documentation reflects reality, and unverified claims are explicitly excluded.