-- Pandoc filter: rewrites .md link targets to .html so cross-document links work
-- on the published site, and wraps mermaid code blocks in a div the browser renders.
-- build-docs.sh copies this file into place; edit it here, never the copy.
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
