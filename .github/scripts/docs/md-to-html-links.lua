-- =============================================================================
-- md-to-html-links.lua — Pandoc Lua filter
-- Usage: passed as --lua-filter by build-docs.sh, build-architecture-docs.sh
--        and build-typedoc-html.sh. All three read it where it is tracked;
--        nothing copies it any more, so this is its only location.
--
-- Rewrites .md link targets to .html so cross-document links resolve on the
-- published site, and wraps mermaid code blocks in a div the browser renders.
--
-- Failure mode: pandoc aborts when a filter will not load, and every calling
-- script runs under `set -euo pipefail`, so the docs build fails instead of
-- publishing pages with broken links.
-- =============================================================================
function Link(el)
  el.target = el.target:gsub("%.md#", ".html#")
  el.target = el.target:gsub("%.md$", ".html")
  return el
end

function CodeBlock(el)
  if el.classes:includes('mermaid') then
    local html = '<div class="mermaid">\n' .. el.text .. '\n</div>'
    return pandoc.RawBlock('html', html)
  end
  return el
end
