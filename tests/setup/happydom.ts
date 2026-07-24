import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register a happy-dom window/document for component tests. Guarded so the
// single preload registration is idempotent; non-DOM tests are unaffected.
if (!("happyDOM" in globalThis)) {
  GlobalRegistrator.register();
}
