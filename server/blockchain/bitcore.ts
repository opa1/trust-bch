import "server-only";

// Fix for "More than one instance of bitcore-lib-cash found" error in Next.js
// This error happens because bitcore-lib checks for global._bitcoreCash and throws if it exists.
// In Next.js dev mode, hot reloading re-runs this module, causing the error.
const globalAny: any = global;

if (globalAny._bitcoreCash) {
  // Clear the global flag to allow re-importing
  delete globalAny._bitcoreCash;
}

if (globalAny._bitcore) {
  delete globalAny._bitcore;
}

// Use require to ensure this runs after the cleanup above
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bitcore = require("bitcore-lib-cash");

export default bitcore;
