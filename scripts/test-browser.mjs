import { createServer } from "vite";
import { spawn } from "node:child_process";
const server = await createServer({
  server: { host: "127.0.0.1", port: 5188, strictPort: true },
});
await server.listen();
try {
  const child = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test"],
    {
      stdio: "inherit",
      env: { ...process.env, COMMON_E2E_SERVER: "http://127.0.0.1:5188" },
    },
  );
  process.exitCode = await new Promise((resolve) => child.on("exit", resolve));
} finally {
  await server.close();
}
