#!/usr/bin/env node
// =============================================================================
// check-openapi-drift.mjs - compares the OpenAPI spec with the Spring controllers
// Usage: node .github/scripts/docs/check-openapi-drift.mjs <bundle.json> <java-src>
//        <bundle.json> is `redocly bundle --dereferenced --ext json` of
//        docs/backend/api/openapi.yaml; <java-src> is src/main/java. Called by
//        check-openapi-drift.sh after the lint.
//
// The spec is written by hand (Standards OPENAPI), so nothing else keeps
// it equal to the code. Compared per /api operation: method and path; query and
// path parameters with their required flag and, for LocalDate/LocalDateTime, the
// date format; the first 2xx JSON response schema against the returned DTO's
// JSON property names, nested DTOs included. A Pageable stands for page, size and
// sort; Page<T> for PagedModel's content array. Responses that are no DTO (Map,
// long, void) and request bodies are not compared.
// The Java side comes from java-reader.mjs; this file fails loudly when the
// reader finds no operation.
//
// Produces: one line per difference and a summary line on stdout.
// FAILURE MODE: exits 1 on any difference, 2 on bad arguments or when the reader
// found nothing to compare (a moved source tree must not pass as "no drift").
// =============================================================================
import { readFileSync } from 'node:fs';
import { expectedParams, indexTypes, javaFiles, readControllers, stripComments, unwrapJava } from './java-reader.mjs';

const [bundlePath, javaRoot] = process.argv.slice(2);
if (!bundlePath || !javaRoot) {
  console.error('usage: check-openapi-drift.mjs <bundle.json> <java-src>');
  process.exit(2);
}

const HTTP = ['get', 'post', 'put', 'patch', 'delete'];
const diffs = [];
const report = (msg) => diffs.push(msg);

function schemaProperties(schema) {
  if (!schema) return null;
  if (schema.allOf) {
    const merged = {};
    for (const part of schema.allOf) Object.assign(merged, schemaProperties(part) || {});
    return merged;
  }
  return schema.properties || null;
}

function compareSchema(where, schema, typeName, types, seen = new Set()) {
  const fields = types.get(typeName);
  if (!fields || seen.has(typeName)) return 0;
  seen.add(typeName);
  const props = schemaProperties(schema);
  if (!props) { report(`${where}: response schema has no properties, ${typeName} has ${fields.length}`); return 1; }
  const javaNames = new Set(fields.map((f) => f.json));
  for (const name of javaNames) if (!(name in props)) report(`${where}: ${typeName}.${name} is sent but not in the spec`);
  for (const name of Object.keys(props)) if (!javaNames.has(name)) report(`${where}: spec property ${name} is not in ${typeName}`);
  let compared = 1;
  for (const field of fields) {
    const inner = unwrapJava(field.type);
    let sub = props[field.json];
    if (!sub || !types.has(inner.core)) continue;
    if (inner.steps.includes('array')) sub = sub.items;
    compared += compareSchema(`${where} > ${field.json}`, sub, inner.core, types, seen);
  }
  return compared;
}

const DATE_FORMATS = { LocalDate: 'date', LocalDateTime: 'date-time' };

function main() {
  const spec = JSON.parse(readFileSync(bundlePath, 'utf8'));
  const sources = javaFiles(javaRoot).map((f) => stripComments(readFileSync(f, 'utf8')));
  const types = indexTypes(sources);
  const ops = readControllers(sources).filter((op) => op.path.startsWith('/api'));
  if (!ops.length) { console.error(`no /api operation found under ${javaRoot}`); process.exit(2); }

  const specOps = new Map();
  for (const [path, item] of Object.entries(spec.paths || {})) {
    for (const method of HTTP) if (item[method]) specOps.set(`${method} ${path}`, { ...item[method], shared: item.parameters || [] });
  }

  let paramCount = 0;
  let schemaCount = 0;
  for (const op of ops) {
    const key = `${op.method} ${op.path}`;
    const where = `${op.method.toUpperCase()} ${op.path}`;
    const specOp = specOps.get(key);
    if (!specOp) { report(`${where}: in the code, not in the spec`); continue; }
    specOps.delete(key);

    const specParams = new Map([...specOp.shared, ...(specOp.parameters || [])]
      .filter((p) => p.in === 'query' || p.in === 'path')
      .map((p) => [`${p.in} ${p.name}`, p]));
    for (const want of expectedParams(op)) {
      paramCount++;
      const got = specParams.get(`${want.in} ${want.name}`);
      if (!got) { report(`${where}: ${want.in} parameter ${want.name} is missing from the spec`); continue; }
      specParams.delete(`${want.in} ${want.name}`);
      if (Boolean(got.required) !== want.required) report(`${where}: ${want.name} required is ${want.required} in the code, ${Boolean(got.required)} in the spec`);
      const javaFormat = DATE_FORMATS[want.type];
      const specFormat = got.schema && got.schema.format;
      const specDate = specFormat === 'date' || specFormat === 'date-time';
      if ((javaFormat || specDate) && javaFormat !== specFormat) report(`${where}: ${want.name} is ${want.type} in the code, format ${specFormat || 'none'} in the spec`);
    }
    for (const extra of specParams.values()) report(`${where}: spec ${extra.in} parameter ${extra.name} is not in the code`);

    const { core, steps } = unwrapJava(op.returnType);
    if (!types.has(core)) continue;
    const code = Object.keys(specOp.responses || {}).find((c) => c.startsWith('2'));
    let schema = code && specOp.responses[code].content && specOp.responses[code].content['application/json'] && specOp.responses[code].content['application/json'].schema;
    if (!schema) { report(`${where}: returns ${core} but the spec has no 2xx JSON schema`); continue; }
    for (const step of steps) {
      schema = step === 'page' ? schema.properties && schema.properties.content : schema;
      if (schema && schema.type === 'array') schema = schema.items;
    }
    schemaCount += compareSchema(`${where} -> ${core}`, schema, core, types);
  }
  for (const key of specOps.keys()) report(`${key.replace(/^\w+/, (m) => m.toUpperCase())}: in the spec, not in the code`);

  for (const d of diffs) console.log(`DRIFT ${d}`);
  console.log(`${ops.length} operations, ${paramCount} parameters, ${schemaCount} schemas compared; ${diffs.length} differences`);
  process.exit(diffs.length ? 1 : 0);
}

main();
