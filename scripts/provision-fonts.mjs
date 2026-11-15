import { mkdir, writeFile } from "node:fs/promises";
await mkdir("public/fonts", { recursive: true });
for (const [name, family] of [
  ["dm-sans", "DM+Sans"],
  ["manrope", "Manrope"],
]) {
  const r = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@400..800&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    },
  );
  if (!r.ok) throw Error("Font metadata download failed");
  const css = await r.text();
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
  const source = urls.at(-1);
  if (!source) throw Error("Font URL missing");
  const font = await fetch(source);
  await writeFile(
    `public/fonts/${name}.woff2`,
    new Uint8Array(await font.arrayBuffer()),
  );
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${name.replaceAll("-", "")}/OFL.txt`,
  );
  if (!license.ok) throw Error("Font license download failed");
  await writeFile(`public/fonts/${name}-OFL.txt`, await license.text());
  console.log(`${name}: self-hosted; SIL Open Font License included`);
}
