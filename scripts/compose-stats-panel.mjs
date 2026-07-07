import fs from "fs";

function loadCard(path) {
  let content = fs.readFileSync(path, "utf8");
  content = content.replace(/<rect\s+data-testid="card-bg"[\s\S]*?\/>/g, "");

  const width = Number(content.match(/<svg[^>]*\bwidth="(\d+)"/)?.[1] ?? 0);
  const height = Number(content.match(/<svg[^>]*\bheight="(\d+)"/)?.[1] ?? 0);
  const viewBox = content.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${width} ${height}`;
  const inner = content
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");

  return { width, height, viewBox, inner };
}

function stripCardBorder(path) {
  const content = fs.readFileSync(path, "utf8");
  const cleaned = content.replace(/<rect\s+data-testid="card-bg"[\s\S]*?\/>/g, "");
  fs.writeFileSync(path, cleaned);
}

const cardPaths = [
  "assets/github-stats.svg",
  "assets/github-rank.svg",
  "assets/github-top-langs.svg",
];

for (const path of cardPaths) {
  stripCardBorder(path);
}

const stats = loadCard("assets/github-stats.svg");
const rank = loadCard("assets/github-rank.svg");
const langs = loadCard("assets/github-top-langs.svg");

const gap = 12;
const totalWidth = stats.width + gap + rank.width + gap + langs.width;
const totalHeight = Math.max(stats.height, rank.height, langs.height);

let x = 0;
const nested = [];

nested.push(
  `<svg x="${x}" y="0" width="${stats.width}" height="${stats.height}" viewBox="${stats.viewBox}">${stats.inner}</svg>`
);
x += stats.width + gap;

const rankY = Math.round((totalHeight - rank.height) / 2);
nested.push(
  `<svg x="${x}" y="${rankY}" width="${rank.width}" height="${rank.height}" viewBox="${rank.viewBox}">${rank.inner}</svg>`
);
x += rank.width + gap;

nested.push(
  `<svg x="${x}" y="0" width="${langs.width}" height="${langs.height}" viewBox="${langs.viewBox}">${langs.inner}</svg>`
);

const panel = `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DonMohsen GitHub stats panel">
${nested.join("\n")}
</svg>
`;

fs.writeFileSync("assets/github-stats-panel.svg", panel);
