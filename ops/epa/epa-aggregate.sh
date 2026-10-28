#!/bin/sh
# =============================================================================
# epa-aggregate.sh - counts what the ssp_api access log saw, per endpoint
# Usage (on the Hetzner host):
#   docker exec -i maintenance-caddy sh -s < epa-aggregate.sh > epa-result.txt
#
# Reads every file in /data/access-logs (the live log and the rolled .gz
# files) inside the Caddy container, which has busybox sh, zcat and awk.
# Prints counts only: no address, no query string, no User-Agent text leaves
# the container. Path segments that hold a digit become {id} (oauth2 kept),
# and paths outside the application prefixes collapse into "(other)".
#
# Produces on stdout:
#   FILE lines   per file: name, lines, first and last ts (epoch seconds)
#   CLASS lines  per User-Agent class: requests
#   DAY lines    per UTC day and class: requests
#   ROW lines    class, method, path, status, requests, first ts, last ts
#   OTHER lines  top first segments of "(other)" paths, any class
#
# Failure mode: prints "ERROR <reason>" and exits 1 when the directory holds
# no log file or no line parses; a line without method, uri or status is
# counted as unparsed in the summary instead of being dropped silently.
# =============================================================================
# pipefail: the parse checks exit inside awk, in the middle of the pipeline;
# without it the script returns sort's status and an ERROR run exits 0.
set -eu
# The script runs only in the Caddy image's busybox ash, which has pipefail
# (caddy:2.10-alpine: an all-unparseable log exits 1 with it, 0 without).
# shellcheck disable=SC3040
set -o pipefail

DIR=/data/access-logs
set -- "$DIR"/ssp-api*
if [ ! -e "$1" ]; then
  echo "ERROR no log file in $DIR"
  exit 1
fi

for f in "$@"; do
  case "$f" in
    *.gz) zcat "$f" | awk -v n="$(basename "$f")" '{ print n "\t" $0 }' ;;
    *) awk -v n="$(basename "$f")" '{ print n "\t" $0 }' "$f" ;;
  esac
done | awk -F '\t' '
function field(s, key,    re) {
  re = "\"" key "\":\"[^\"]*\""
  if (!match(s, re)) return ""
  return substr(s, RSTART + length(key) + 4, RLENGTH - length(key) - 5)
}
function uaclass(ua) {
  if (ua == "") return "none"
  if (ua ~ /HeadlessChrome|Playwright/) return "headless"
  if (ua ~ /^curl\//) return "curl"
  if (ua ~ /[Bb]ot|[Cc]rawl|[Ss]pider|[Ss]can|zgrab|Censys|Expanse|facebookexternalhit|Slurp/) return "bot"
  if (ua ~ /python|Go-http-client|axios|node-fetch|undici|okhttp|Java\/|libwww|wget|Wget|httpx|aiohttp/) return "script"
  if (ua ~ /^Mozilla\/5\.0/) return "browser"
  return "other"
}
function normpath(p,    n, i, seg, out) {
  sub(/\?.*/, "", p)
  sub(/#.*/, "", p)
  if (p !~ /^\/(api|actuator|oauth2|login|logout|health|v3|swagger-ui|error)(\/|$)/) {
    return "(other)"
  }
  n = split(p, seg, "/")
  out = ""
  for (i = 2; i <= n; i++) {
    if (seg[i] ~ /[0-9]/ && seg[i] != "oauth2") seg[i] = "{id}"
    out = out "/" seg[i]
  }
  if (out == "") out = "/"
  return out
}
{
  file = $1; line = substr($0, length($1) + 2)
  lines[file]++
  if (match(line, /"ts":[0-9.]+/)) {
    ts = substr(line, RSTART + 5, RLENGTH - 5) + 0
    if (!(file in ffirst) || ts < ffirst[file]) ffirst[file] = ts
    if (ts > flast[file]) flast[file] = ts
  } else ts = 0
  method = field(line, "method"); uri = field(line, "uri")
  st = ""
  if (match(line, /"status":[0-9]+/)) st = substr(line, RSTART + 9, RLENGTH - 9)
  if (method == "" || uri == "" || st == "") { unparsed++; next }
  ua = ""
  if (match(line, /"User-Agent":\["[^"]*/)) ua = substr(line, RSTART + 15, RLENGTH - 15)
  c = uaclass(ua)
  path = normpath(uri)
  parsed++
  cls[c]++
  day = int(ts / 86400)
  days[day SUBSEP c]++
  k = c "\t" method "\t" path "\t" st
  rows[k]++
  if (!(k in rfirst) || ts < rfirst[k]) rfirst[k] = ts
  if (ts > rlast[k]) rlast[k] = ts
  if (path == "(other)") {
    o = uri; sub(/\?.*/, "", o); n = split(o, s2, "/")
    o = (n >= 2) ? "/" s2[2] : "/"
    if (length(o) > 40) o = substr(o, 1, 40) "..."
    other[o]++
  }
}
END {
  if (parsed == 0) { print "ERROR no line parsed (" unparsed + 0 " unparsed)"; exit 1 }
  print "SUMMARY\tparsed\t" parsed "\tunparsed\t" unparsed + 0
  for (f in lines) printf "FILE\t%s\t%d\t%.0f\t%.0f\n", f, lines[f], ffirst[f], flast[f]
  for (c in cls) print "CLASS\t" c "\t" cls[c]
  for (d in days) { split(d, dk, SUBSEP); print "DAY\t" dk[1] "\t" dk[2] "\t" days[d] }
  for (k in rows) printf "ROW\t%s\t%d\t%.0f\t%.0f\n", k, rows[k], rfirst[k], rlast[k]
  for (o in other) print "OTHER\t" o "\t" other[o]
}' | sort
