import { spawnSync } from "node:child_process";
const result = spawnSync("git", ["credential", "fill"], {
  input: "protocol=https\nhost=github.com\n\n",
  encoding: "utf8",
  env: { ...process.env, GCM_INTERACTIVE: "never", GIT_TERMINAL_PROMPT: "0" },
});
if (result.status !== 0) throw Error("GitHub credentials unavailable");
const credential = Object.fromEntries(
  result.stdout
    .trim()
    .split("\n")
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const headers = {
  Authorization: `Bearer ${credential.password}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
};
const base = "https://api.github.com/repos/jrschwab15-netizen/common";
const call = async (path, method = "GET", body) => {
  const r = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!r.ok)
    throw Error(`${method} ${path}: ${r.status} ${data.message || ""}`);
  return data;
};
if (process.argv.includes("--prepare-pages")) {
  let pages;
  try {
    pages = await call("/pages");
  } catch (e) {
    if (!String(e).includes("404")) throw e;
    pages = await call("/pages", "POST", { build_type: "workflow" });
  }
  await call("/pages", "PUT", {
    cname: "ourcommon.co",
    build_type: "workflow",
  });
  console.log(
    "Pages configured for Actions; custom domain reserved. DNS unchanged. Deployment remains manual.",
  );
}
if (process.argv.includes("--status")) {
  const runs = await call("/actions/runs?per_page=5");
  console.log(
    JSON.stringify(
      runs.workflow_runs.map((r) => ({
        id: r.id,
        status: r.status,
        conclusion: r.conclusion,
        url: r.html_url,
      })),
      null,
      2,
    ),
  );
  try {
    const pages = await call("/pages");
    console.log(
      JSON.stringify({
        pages_url: pages.html_url,
        status: pages.status,
        cname: pages.cname,
        https_enforced: pages.https_enforced,
      }),
    );
  } catch (e) {
    console.log(String(e));
  }
}
if (process.argv.includes("--protect")) {
  try {
    await call("/branches/main/protection", "PUT", {
      required_status_checks: { strict: true, contexts: ["build"] },
      enforce_admins: false,
      required_pull_request_reviews: { required_approving_review_count: 1 },
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false,
    });
    console.log(
      "Main protected: build and review required; no force pushes or deletion.",
    );
  } catch (e) {
    console.log(`Branch protection needs manual setup: ${e.message}`);
  }
}
