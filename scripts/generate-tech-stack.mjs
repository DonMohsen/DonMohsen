import fs from "fs/promises";

const TOTAL_WIDTH = 1200;
const HEADER_HEIGHT = 34;
const ROW_HEIGHT = 52;
const PADDING_Y = 10;
const TITLE_COLOR = "#62c1ec";
const BORDER_COLOR = "#e4e2e2";

const COLUMNS = [
  {
    title: "Languages",
    weight: 300,
    rows: ["ts,js", "html,css", "cs,python"],
  },
  {
    title: "Frontend & Mobile",
    weight: 280,
    rows: ["nextjs,react", "flutter,kotlin", null],
  },
  {
    title: "Backend & Data",
    weight: 280,
    rows: ["express", "dotnet", null],
  },
  {
    title: "Infrastructure & Delivery",
    weight: 400,
    rows: ["git,github,gitlab", "docker,githubactions", "ubuntu,debian"],
  },
  {
    title: "AI & Workflow",
    weight: 280,
    rows: ["vscode,visualstudio", "claudeai,cursor", null],
  },
];

const iconCache = new Map();

function iconUrl(slug, provider = "skillicons") {
  if (provider === "syvixor") {
    return `https://skills.syvixor.com/api/icons?i=${slug}`;
  }
  return `https://skillicons.dev/icons?i=${slug}`;
}

async function fetchIcon(slug, provider = "skillicons") {
  const cacheKey = `${provider}:${slug}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const response = await fetch(iconUrl(slug, provider));
  if (!response.ok) {
    throw new Error(`Failed to fetch icon "${slug}" from ${provider}: ${response.status}`);
  }

  const svg = await response.text();
  const width = Number(svg.match(/<svg[^>]*\bwidth="([\d.]+)"/)?.[1] ?? 0);
  const height = Number(svg.match(/<svg[^>]*\bheight="([\d.]+)"/)?.[1] ?? 48);
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${width} ${height}`;
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");

  const icon = { width, height, viewBox, inner };
  iconCache.set(cacheKey, icon);
  return icon;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function columnWidths() {
  const totalWeight = COLUMNS.reduce((sum, column) => sum + column.weight, 0);
  return COLUMNS.map((column) =>
    Math.round((column.weight / totalWeight) * TOTAL_WIDTH)
  );
}

async function main() {
  const widths = columnWidths();
  const totalHeight =
    PADDING_Y + HEADER_HEIGHT + COLUMNS[0].rows.length * ROW_HEIGHT + PADDING_Y;

  let x = 0;
  const parts = [];

  parts.push(
    `<rect x="0.5" y="0.5" width="${TOTAL_WIDTH - 1}" height="${totalHeight - 1}" rx="6" fill="transparent" stroke="${BORDER_COLOR}" stroke-width="1"/>`
  );

  for (let columnIndex = 0; columnIndex < COLUMNS.length; columnIndex += 1) {
    const column = COLUMNS[columnIndex];
    const columnWidth = widths[columnIndex];

    if (columnIndex > 0) {
      parts.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${totalHeight}" stroke="${BORDER_COLOR}" stroke-width="1"/>`
      );
    }

    parts.push(
      `<text x="${x + columnWidth / 2}" y="${PADDING_Y + 22}" fill="${TITLE_COLOR}" font-family="'Fira Code', 'Segoe UI', Ubuntu, sans-serif" font-size="18" font-weight="600" text-anchor="middle">${escapeXml(column.title)}</text>`
    );

    for (let rowIndex = 0; rowIndex < column.rows.length; rowIndex += 1) {
      const slug = column.rows[rowIndex];
      if (!slug) {
        continue;
      }

      const provider = slug === "claudeai,cursor" ? "syvixor" : "skillicons";
      const icon = await fetchIcon(slug, provider);
      const rowTop = PADDING_Y + HEADER_HEIGHT + rowIndex * ROW_HEIGHT;
      const iconX = x + (columnWidth - icon.width) / 2;
      const iconY = rowTop + (ROW_HEIGHT - icon.height) / 2;

      parts.push(
        `<svg x="${iconX}" y="${iconY}" width="${icon.width}" height="${icon.height}" viewBox="${icon.viewBox}">${icon.inner}</svg>`
      );
    }

    x += columnWidth;
  }

  for (let rowIndex = 1; rowIndex < COLUMNS[0].rows.length; rowIndex += 1) {
    const y = PADDING_Y + HEADER_HEIGHT + rowIndex * ROW_HEIGHT;
    parts.push(
      `<line x1="0" y1="${y}" x2="${TOTAL_WIDTH}" y2="${y}" stroke="${BORDER_COLOR}" stroke-width="1"/>`
    );
  }

  const svg = `<svg width="${TOTAL_WIDTH}" height="${totalHeight}" viewBox="0 0 ${TOTAL_WIDTH} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mohsen tech stack">
${parts.join("\n")}
</svg>
`;

  await fs.mkdir("assets", { recursive: true });
  await fs.writeFile("assets/tech-stack-panel.svg", svg);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
