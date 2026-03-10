const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const mdFile = path.join(__dirname, "example.md");
const outDir = path.join(__dirname, "dist");
const outFile = path.join(outDir, "index.html");

const markdown = fs.readFileSync(mdFile, "utf-8");
const htmlBody = marked.parse(markdown);

// Extract first heading for the page title
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
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html);
console.log("Built dist/index.html from example.md");
