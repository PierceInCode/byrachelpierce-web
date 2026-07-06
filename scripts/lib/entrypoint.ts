import { pathToFileURL } from 'node:url';

/**
 * True when the module identified by `importMetaUrl` is the script Node was
 * launched with (i.e. run directly), rather than being imported by another
 * module such as a test file.
 *
 * Scripts use this to guard their top-level `main()` call so that unit tests
 * can `import` the script's pure helpers without triggering its side effects
 * (DB connections, file writes, `process.exit`).
 *
 * For C# developers: this is the equivalent of gating work behind
 * `if (args == Environment.GetCommandLineArgs...)` — only the entry assembly
 * runs `Main`, a referenced library does not.
 */
export function isMain(importMetaUrl: string): boolean {
  const entry = process.argv[1];
  return entry !== undefined && importMetaUrl === pathToFileURL(entry).href;
}
