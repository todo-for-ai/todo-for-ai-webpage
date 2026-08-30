/**
 * Agent API — re-export shim for backward compatibility.
 *
 * All exports are now provided by the agents/ subdirectory.
 * This file exists solely to maintain backward compatibility for imports
 * like `import { ... } from './agents'`.
 *
 * New code should import directly from './agents/index' or specific submodules.
 */

export * from './agents/index'