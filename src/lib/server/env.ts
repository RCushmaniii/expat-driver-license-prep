/**
 * Read an environment variable at RUNTIME.
 *
 * Vite statically inlines `import.meta.env.X` at BUILD time — so a secret added
 * to Vercel *after* a build (or reused via build cache on redeploy) gets baked
 * in as `undefined`, and the code silently sees no value. This caused the rate
 * limiter to fail open in production (see PR #43).
 *
 * On Vercel's Node serverless runtime, `process.env` holds the deployment's
 * live env vars and is never inlined for server routes, so it is the reliable
 * source for any secret read inside an API route. `import.meta.env` (dynamic
 * key → not inlined) stays as a local-dev fallback.
 *
 * Use this for EVERY server-side secret read. Never read secrets directly via
 * `import.meta.env.SECRET` in a route — that is the build-inlining trap.
 */
export function readEnv(name: string): string | undefined {
  const fromProcess =
    typeof process !== "undefined" ? process.env?.[name] : undefined;
  return fromProcess ?? (import.meta.env[name] as string | undefined);
}
