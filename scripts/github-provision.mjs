// Uses existing Git credential-manager authorization; never prints or persists credentials.
import { spawnSync } from "node:child_process";
const credential = spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" },
});
if (credential.status !== 0) {
  console.error(
    "No noninteractive GitHub credentials available. Create the repository in GitHub or authenticate Git Credential Manager.",
  );
  process.exit(2);
}
const fields = Object.fromEntries(
  credential.stdout
    .trim()
    .split("\n")
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
if (!fields.password) {
  console.error("No GitHub credential available.");
  process.exit(2);
}
const headers = {
  Authorization: `Bearer ${fields.password}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
const user = await (
  await fetch("https://api.github.com/user", { headers })
).json();
if (!user.login) throw Error("GitHub authentication failed");
console.log(`Authenticated GitHub owner: ${user.login}`);
const existing = await fetch(
  `https://api.github.com/repos/${user.login}/common`,
  { headers },
);
console.log(`common repository lookup: ${existing.status}`);
if (process.argv.includes("--create")) {
  if (existing.status !== 404)
    throw Error("Will not modify an existing repository.");
  const r = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "common",
      description: "Public spaces. Public record.",
      private: process.argv.includes("--private"),
      auto_init: true,
    }),
  });
  if (!r.ok) throw Error(`Repository creation failed: ${r.status}`);
  console.log((await r.json()).html_url);
}
