import fs from "fs/promises";

const TITLE_COLOR = "#62c1ec";
const ICON_ROW_HEIGHT = 58;
const HEADER_GAP = 6;
const PADDING_Y = 4;

const COLUMNS = [
  {
    title: "Languages",
    headerWidth: 300,
    rows: ["ts,js", "html,css", "cs,python"],
  },
  {
    title: "Frontend & Mobile",
    headerWidth: 280,
    rows: ["nextjs,react", "flutter,kotlin", null],
  },
  {
    title: "Backend & Data",
    headerWidth: 280,
    rows: ["express", "dotnet", null],
  },
  {
    title: "Infrastructure & Delivery",
    headerWidth: 400,
    rows: ["git,github,gitlab", "docker,githubactions", "ubuntu,debian"],
  },
  {
    title: "AI & Workflow",
    headerWidth: 280,
    rows: ["vscode,visualstudio", "claudeai,cursor", null],
  },
];

const TOTAL_WIDTH = COLUMNS.reduce((sum, column) => sum + column.headerWidth, 0);
const ROW_COUNT = COLUMNS[0].rows.length;

const cache = new Map();

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconUrl(slug, provider = "skillicons") {
  if (provider === "syvixor") {
    return `https://skills.syvixor.com/api/icons?i=${slug}`;
  }
  return `https://skillicons.dev/icons?i=${slug}`;
}

function headerUrl(title, width) {
  const lines = encodeURIComponent(title);
  return `https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=25&pause=1000&color=62c1ec&center=true&vCenter=true&repeat=false&random=false&width=${width}&lines=${lines}`;
}

function parseSvgSize(svg) {
  const widthMatch = svg.match(/\bwidth=['"]([\d.]+)(?:px)?['"]/i);
  const heightMatch = svg.match(/\bheight=['"]([\d.]+)(?:px)?['"]/i);
  const viewBoxMatch = svg.match(/viewBox=['"]([^'"]+)['"]/i);
  const width = Number(widthMatch?.[1] ?? 0);
  const height = Number(heightMatch?.[1] ?? 0);
  const viewBox = viewBoxMatch?.[1] ?? `0 0 ${width} ${height}`;
  return { width, height, viewBox };
}

async function fetchSvgParts(url, cacheKey) {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch "${cacheKey}": ${response.status}`);
  }

  const svg = await response.text();
  const { width, height, viewBox } = parseSvgSize(svg);
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .replace(/<a[\s\S]*?<\/a>/gi, "");

  const parts = { width, height, viewBox, inner };
  cache.set(cacheKey, parts);
  return parts;
}

function fallbackHeader(title, width) {
  return {
    width,
    height: 32,
    viewBox: `0 0 ${width} 32`,
    inner: `<text x="${width / 2}" y="22" fill="${TITLE_COLOR}" font-family="'Fira Code', 'Segoe UI', Ubuntu, sans-serif" font-size="25" font-weight="500" text-anchor="middle">${escapeXml(title)}</text>`,
  };
}

async function fetchHeader(title, width) {
  try {
    return await fetchSvgParts(headerUrl(title, width), `header:${title}`);
  } catch {
    return fallbackHeader(title, width);
  }
}

async function fetchIcon(slug, provider = "skillicons") {
  return fetchSvgParts(iconUrl(slug, provider), `${provider}:${slug}`);
}

async function main() {
  const headers = await Promise.all(
    COLUMNS.map((column) => fetchHeader(column.title, column.headerWidth))
  );

  const headerHeight = Math.max(...headers.map((header) => header.height), 32);
  const totalHeight =
    PADDING_Y + headerHeight + HEADER_GAP + ROW_COUNT * ICON_ROW_HEIGHT + PADDING_Y;

  let x = 0;
  const parts = [];

  for (let columnIndex = 0; columnIndex < COLUMNS.length; columnIndex += 1) {
    const column = COLUMNS[columnIndex];
    const columnWidth = column.headerWidth;
    const header = headers[columnIndex];
    const headerX = x + (columnWidth - header.width) / 2;

    parts.push(
      `<svg x="${headerX}" y="${PADDING_Y}" width="${header.width}" height="${header.height}" viewBox="${header.viewBox}">${header.inner}</svg>`
    );

    for (let rowIndex = 0; rowIndex < column.rows.length; rowIndex += 1) {
      const slug = column.rows[rowIndex];
      if (!slug) {
        continue;
      }

      const provider = slug === "claudeai,cursor" ? "syvixor" : "skillicons";
      const icon = await fetchIcon(slug, provider);
      const rowTop = PADDING_Y + headerHeight + HEADER_GAP + rowIndex * ICON_ROW_HEIGHT;
      const iconX = x + (columnWidth - icon.width) / 2;
      const iconY = rowTop + (ICON_ROW_HEIGHT - icon.height) / 2;

      parts.push(
        `<svg x="${iconX}" y="${iconY}" width="${icon.width}" height="${icon.height}" viewBox="${icon.viewBox}">${icon.inner}</svg>`
      );
    }

    x += columnWidth;
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
