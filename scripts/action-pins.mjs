for (const [repo, tag] of [
  ["checkout", "v4"],
  ["setup-node", "v4"],
  ["configure-pages", "v5"],
  ["upload-pages-artifact", "v3"],
  ["deploy-pages", "v4"],
]) {
  const r = await fetch(
    `https://api.github.com/repos/actions/${repo}/commits/${tag}`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  const d = await r.json();
  if (!r.ok || !d.sha) throw Error(`Pin lookup failed: ${repo}`);
  console.log(repo, tag, d.sha);
}
