// Minimal Markdown → HTML converter with a simple site template.
// Usage: node scripts/md2html.mjs <input.md> <output.html>

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { marked } from 'marked';

const [,, inPath, outPath] = process.argv;

// Simple argument check
if (!inPath || !outPath) {
  console.error('Usage: node scripts/md2html.mjs <input.md> <output.html>');
  process.exit(1);
}

// Read Markdown, convert to HTML
const md = readFileSync(inPath, 'utf-8');
const html = marked.parse(md);

// Basic site chrome to match your index.html header/nav styles
const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Security Overview – SmartSupplyPro</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Security architecture for SmartSupplyPro (OAuth2, sessions, CORS, CSRF, roles)." />
  <link rel="icon" href="https://keglev.github.io/inventory-service/favicon.ico" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #fafafa; color: #111; }
    header { background-color: #0d1117; color: white; padding: 1rem 2rem;
             display: flex; justify-content: space-between; align-items: center; }
    nav { background: #f3f4f6; padding: 1rem 2rem; }
    nav a { margin-right: 1.5rem; text-decoration: none; font-weight: 500; color: #0366d6; }
    nav a:hover { text-decoration: underline; }
    main { max-width: 900px; margin: 2rem auto; padding: 0 2rem; line-height: 1.6; }
    main h1, main h2, main h3 { color: #0d1117; }
    pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                "Liberation Mono", "Courier New", monospace; background: #f6f8fa;
                border-radius: 6px; padding: 0.2rem 0.4rem; }
    pre { padding: 1rem; overflow: auto; }
    footer { text-align: center; padding: 2rem; font-size: 0.875rem; color: #666; }
  </style>
</head>
<body>
  <header>
    <h1>🔐 Security Overview</h1>
    <a href="https://github.com/Keglev/inventory-service" target="_blank" style="color: #58a6ff;">View on GitHub ↗</a>
  </header>
  <nav>
    <a href="../index.html">🏠 Home</a>
    <a href="../api.html">📘 API Reference</a>
  </nav>
  <main>
    ${html}
  </main>
  <footer>© 2025 SmartSupplyPro – Security Overview</footer>
</body>
</html>`;

// Ensure output directory exists, write the file
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, page, 'utf-8');
console.log(`Wrote ${outPath}`);
