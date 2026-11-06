// =============================================================================
// java-reader.mjs - reads controllers and DTOs for check-openapi-drift.mjs
// Usage: import { ... } from './java-reader.mjs'; no command line of its own.
//
// A tokenizer, not a compiler: it knows the shapes this backend uses. Records
// and Lombok classes with private instance fields become DTOs (@JsonProperty
// renames a property, @JsonIgnore drops it); @RestController classes with
// @RequestMapping and @Get/Post/Put/Patch/DeleteMapping methods become
// operations, their @RequestParam and @PathVariable arguments parameters.
// String literals survive comment stripping, so a URL never starts a comment.
//
// Produces: plain objects; the comparison lives in check-openapi-drift.mjs.
// FAILURE MODE: none of its own; an unreadable tree surfaces in the caller as
// "no /api operation found" (exit 2).
// =============================================================================
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Comments go, string literals stay: a URL in a string must not start a comment.
export function stripComments(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j;
    } else if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1;
      if (i === 0) break;
    } else {
      out += c;
    }
  }
  return out;
}

// Index of the bracket that closes the one at `open`, nesting () <> {} together.
function closing(text, open) {
  const pairs = { '(': ')', '<': '>', '{': '}' };
  const stack = [];
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { i = text.indexOf('"', i + 1); continue; }
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === stack[stack.length - 1]) { stack.pop(); if (!stack.length) return i; }
  }
  return -1;
}

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { i = text.indexOf('"', i + 1); continue; }
    if ('(<{'.includes(c)) depth++;
    else if (')>}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

// Annotations of one declaration, then the type and the name that follow them.
function parseDeclaration(text) {
  const annotations = [];
  let rest = text.trim();
  for (;;) {
    const m = /^@([\w.]+)/.exec(rest);
    if (!m) break;
    let end = m[0].length;
    let args = '';
    if (rest[end] === '(') {
      const close = closing(rest, end);
      args = rest.slice(end + 1, close);
      end = close + 1;
    }
    annotations.push({ name: m[1].split('.').pop(), args });
    rest = rest.slice(end).trim();
  }
  rest = rest.replace(/^final\s+/, '');
  const m = /^(.*\S)\s+(\w+)$/s.exec(rest);
  return m ? { annotations, type: m[1].replace(/\s+/g, ''), name: m[2] } : null;
}

function annotationValue(args, keys) {
  for (const key of keys) {
    const m = new RegExp(`\\b${key}\\s*=\\s*"([^"]*)"`).exec(args);
    if (m) return m[1];
  }
  const bare = /^\s*"([^"]*)"/.exec(args);
  return bare ? bare[1] : null;
}

export function javaFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return javaFiles(path);
    return entry.endsWith('.java') ? [path] : [];
  });
}

// DTO index: simple name -> [{ json, type }] for every record and every class
// with private instance fields (Lombok generates the accessors Jackson reads).
export function indexTypes(sources) {
  const types = new Map();
  for (const src of sources) {
    const recordRe = /\brecord\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g;
    for (let m; (m = recordRe.exec(src));) {
      const open = m.index + m[0].length - 1;
      const comps = splitTopLevel(src.slice(open + 1, closing(src, open)));
      types.set(m[1], comps.map(parseDeclaration).filter(Boolean).flatMap(toProperty));
    }
    const classRe = /\bclass\s+(\w+)[^{]*\{/g;
    for (let m; (m = classRe.exec(src));) {
      const open = m.index + m[0].length - 1;
      const body = src.slice(open + 1, closing(src, open));
      const fields = [];
      // Fields at the class's own level only: blank out nested blocks first.
      let flat = '';
      for (let i = 0, depth = 0; i < body.length; i++) {
        if (body[i] === '{') depth++;
        if (depth === 0) flat += body[i];
        if (body[i] === '}') depth--;
      }
      for (const stmt of flat.split(';')) {
        const decl = /((?:@[\w.]+(?:\([^)]*\))?\s*)*)private\s+(?!static)([\w<>,.?\s[\]]+?)\s+(\w+)\s*(=.*)?$/s.exec(stmt.trim());
        if (decl) {
          const parsed = parseDeclaration(`${decl[1]} ${decl[2]} ${decl[3]}`);
          if (parsed) fields.push(...toProperty(parsed));
        }
      }
      if (fields.length && !types.has(m[1])) types.set(m[1], fields);
    }
  }
  return types;
}

function toProperty(decl) {
  if (decl.annotations.some((a) => a.name === 'JsonIgnore')) return [];
  const renamed = decl.annotations.find((a) => a.name === 'JsonProperty');
  const json = (renamed && annotationValue(renamed.args, ['value'])) || decl.name;
  return [{ json, type: decl.type }];
}

// Peels ResponseEntity, List, Set and Page off a Java type. Page<T> is
// serialised as Spring Data's PagedModel, whose rows sit in `content`.
export function unwrapJava(type) {
  const steps = [];
  for (;;) {
    const m = /^(ResponseEntity|List|Set|Collection|Page|Optional)<(.*)>$/.exec(type);
    if (!m) return { core: type, steps };
    if (m[1] === 'Page') steps.push('page');
    else if (['List', 'Set', 'Collection'].includes(m[1])) steps.push('array');
    type = m[2];
  }
}

export function readControllers(sources) {
  const ops = [];
  for (const src of sources) {
    // The class annotations sit between the last import and `public class`.
    const cls = /public\s+class\s+\w+/.exec(src);
    if (!cls) continue;
    const head = parseDeclaration(`${src.slice(src.lastIndexOf(';', cls.index) + 1, cls.index)} X x`);
    if (!head || !head.annotations.some((a) => /^(Rest)?Controller$/.test(a.name))) continue;
    const base = head.annotations.find((a) => a.name === 'RequestMapping');
    const basePath = base ? annotationValue(base.args, ['value', 'path']) || '' : '';
    const mapRe = /@(Get|Post|Put|Patch|Delete)Mapping\b/g;
    for (let m; (m = mapRe.exec(src));) {
      const after = m.index + m[0].length;
      const args = src[after] === '(' ? src.slice(after + 1, closing(src, after)) : null;
      const sub = args ? annotationValue(args, ['value', 'path']) || '' : '';
      const path = (basePath + sub) || '/';
      const sig = /public\s+(.+?)\s+(\w+)\s*\(/s.exec(src.slice(m.index));
      const open = m.index + sig.index + sig[0].length - 1;
      const params = splitTopLevel(src.slice(open + 1, closing(src, open))).map(parseDeclaration);
      ops.push({ method: m[1].toLowerCase(), path, returnType: sig[1].replace(/\s+/g, ''), params });
    }
  }
  return ops;
}

export function expectedParams(op) {
  const out = [];
  for (const p of op.params) {
    if (!p) continue;
    if (p.type === 'Pageable') {
      for (const name of ['page', 'size', 'sort']) out.push({ name, in: 'query', required: false, type: 'int' });
      continue;
    }
    const rp = p.annotations.find((a) => a.name === 'RequestParam');
    const pv = p.annotations.find((a) => a.name === 'PathVariable');
    if (!rp && !pv) continue;
    const ann = rp || pv;
    const name = annotationValue(ann.args, ['value', 'name']) || p.name;
    const optional = /required\s*=\s*false/.test(ann.args) || /defaultValue\s*=/.test(ann.args) || p.type.startsWith('Optional<');
    out.push({ name, in: rp ? 'query' : 'path', required: !optional, type: p.type });
  }
  return out;
}
