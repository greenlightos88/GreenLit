# Runtime Acceptance sign-offs

One file per release-candidate commit, named `<full-commit-sha>.md`, recording
that the runtime acceptance checklist
(`docs/release/RUNTIME_ACCEPTANCE_CHECKLIST.md`) passed against a real
authenticated environment for that exact commit.

`scripts/release-candidate.sh` reports **RELEASE READY** only when a sign-off
file exists for `git rev-parse HEAD` (or `RELEASE_RUNTIME_SIGNOFF` matches it).
Use the sign-off template at the end of the checklist. Do not create a sign-off
unless every required step actually passed.
