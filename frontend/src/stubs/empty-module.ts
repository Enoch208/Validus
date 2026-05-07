// Stub module for optional peer dependencies that wagmi/AppKit reference via
// dynamic `import()` inside try/catch. Turbopack tries to statically resolve
// these at build time and fails — aliasing them to this empty module makes
// the build pass while preserving the runtime fallback (the .catch() handler
// fires as if the module is missing).
export {};
