const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const mdFile = path.join(__dirname, "example.md");
const outDir = path.join(__dirname, "dist");
const outFile = path.join(outDir, "index.html");

function fixMultilineTableCells(md) {
  const lines = md.split('\n');
  const result = [];
  let i = 0;
  let inCodeBlock = false;

  while (i < lines.length) {
    const trimmed = lines[i].trimEnd();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(lines[i]);
      i++;
      continue;
    }

    if (!inCodeBlock && trimmed.startsWith('|') && !trimmed.endsWith('|')) {
      let accumulated = trimmed;
      i++;
      while (i < lines.length) {
        const nextTrimmed = lines[i].trimEnd();
        if (nextTrimmed === '') {
          i++;
          continue;
        }
        accumulated += ' ' + nextTrimmed;
        i++;
        if (nextTrimmed.endsWith('|')) {
          break;
        }
      }
      result.push(accumulated);
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

const rawMarkdown = fs.readFileSync(mdFile, "utf-8");
const markdown = fixMultilineTableCells(rawMarkdown);

const headings = [];
const slugCounts = {};

const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  if (lang === 'mermaid') {
    return `<pre class="mermaid">${text}</pre>`;
  }
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escaped}</code></pre>`;
};

renderer.heading = function ({ text, depth }) {
  const raw = text.replace(/<[^>]+>/g, '').trim();
  let slug = raw.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
  if (slugCounts[slug] != null) {
    slugCounts[slug]++;
    slug += '-' + slugCounts[slug];
  } else {
    slugCounts[slug] = 0;
  }
  headings.push({ text: raw, slug, depth });
  return `<h${depth} id="${slug}">${text}</h${depth}>`;
};

const htmlBody = marked.parse(markdown, { renderer });

function buildToc(headings) {
  let toc = '<nav class="toc"><h2>Table of Contents</h2><ul>';
  for (const h of headings) {
    const indent = (h.depth - 1) * 1.2;
    toc += `<li style="margin-left:${indent}em"><a href="#${h.slug}">${h.text}</a></li>`;
  }
  toc += '</ul></nav><hr>';
  return toc;
}

const titleMatch = markdown.match(/^#\s+(.+)/m);
const title = titleMatch ? titleMatch[1] : "Markdown Site";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 { margin-top: 1.5em; }
    code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      padding: 0;
      background: none;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin-left: 0;
      padding-left: 1em;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em 1em;
      text-align: left;
    }
    th { background: #f4f4f4; }
    a { color: #0366d6; }
    ul, ol { padding-left: 1.5em; }
    .toc { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 1em 1.5em; margin-bottom: 2em; }
    .toc h2 { margin-top: 0; font-size: 1.2em; }
    .toc ul { list-style: none; padding-left: 0; margin-bottom: 0; }
    .toc li { padding: 0.15em 0; }
    .toc a { text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .mermaid { background: none; text-align: center; }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</head>
<body>
${buildToc(headings)}
${htmlBody}
</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);

for (const folder of ["images", "videos"]) {
  const srcDir = path.join(__dirname, folder);
  const destDir = path.join(outDir, folder);
  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
    console.log(`Copied ${files.length} file(s) to dist/${folder}/`);
  }
}

console.log("Built dist/index.html from example.md");
