// @ts-ignore
process.loadEnvFile();
console.log(
  "Environment loaded. DATABASE_URL present:",
  !!process.env.DATABASE_URL,
);
