# Endpoint-usage measurement (EPA)

How to repeat the measurement behind backend ADR-0018: which API endpoints are
called, by which kind of client, over a window of about two weeks. The access
log it reads exists only while a measurement runs; it was removed after the
2026-10 window.

The output holds counts only. No address, query string or User-Agent text
leaves the host, so the result file can be kept and shared. Raw log lines are
personal data (masked addresses, browser strings): they stay on the host and
are deleted with the log.

## 1. Turn the log on

The API host's Caddy lives in the maintenance-assistant repository
(`docker/caddy/Caddyfile`, site block for `api.smartsupplypro.de`). Add this
block inside that site block, before `reverse_proxy`, as it stood for the
2026-10 window:

```
log ssp_api {
	output file /data/access-logs/ssp-api.log {
		roll_size 10MiB
		roll_keep 5
		roll_keep_for 336h
	}
	format filter {
		request>remote_ip ip_mask 16 32
		request>client_ip ip_mask 16 32
		request>headers>X-Forwarded-For ip_mask 16 32
		request>headers>Referer delete
		request>uri query {
			delete code
			delete state
		}
		resp_headers>Location delete
		wrap json
	}
}
```

What the filters keep out: the last two bytes of every IPv4 address, the
Referer, the OAuth callback's `code` and `state`, and redirect targets. Caddy
redacts Cookie, Set-Cookie and Authorization by default. Deploy the Caddyfile
and reload Caddy; note the start time. Before turning it on, the privacy page
must name the log, or the window must be short and the log removed after it
(the 2026-10 choice).

## 2. Run the aggregation

After the window, on the host (PowerShell on the operator's PC, then SSH):

```
scp ops/epa/epa-aggregate.sh deploy@<host IPv4>:~/
ssh deploy@<host IPv4>
docker exec -i maintenance-caddy sh -s < epa-aggregate.sh > epa-result.txt
exit
scp deploy@<host IPv4>:~/epa-result.txt .
```

The script reads every file in `/data/access-logs` inside the Caddy container,
the live log and the rolled `.gz` files, with the container's own busybox
`zcat` and `awk`. Run it before the oldest rolled file reaches
`roll_keep_for`, or that part of the window is gone.

## 3. Read the result

Lines are tab-separated and sorted by kind:

- `SUMMARY parsed <n> unparsed <n>`: a line without method, URI or status is
  counted as unparsed, never dropped silently.
- `FILE <name> <lines> <first ts> <last ts>`: epoch seconds; the window is the
  first `FILE` start to the last `FILE` end.
- `CLASS <class> <requests>`: User-Agent class (browser, headless, curl, bot,
  script, other, none). Our own probes and CI runs show up as headless and curl.
- `DAY <UTC day number> <class> <requests>`: day number = epoch seconds / 86400.
- `ROW <class> <method> <path> <status> <requests> <first ts> <last ts>`:
  path segments that hold a digit become `{id}`; a segment without a digit
  stays as sent, so check literal ids too when counting an endpoint.
- `OTHER <first segment> <requests>`: paths outside the application prefixes
  (scanners probing `.env`, `.git`, `wp-*`).

Example with one synthetic input line (invented data, masked documentation
address):

```
{"level":"info","ts":1790000000.123,"logger":"http.log.access.ssp_api","msg":"handled request","request":{"remote_ip":"203.0.0.0","client_ip":"203.0.0.0","proto":"HTTP/1.1","method":"GET","host":"api.example.test","uri":"/api/inventory/item-42?size=20","headers":{"Accept":["application/json"],"User-Agent":["Mozilla/5.0 (X11; Linux x86_64) ExampleBrowser/1.0"]}},"bytes_read":0,"duration":0.012,"size":431,"status":200,"resp_headers":{"Content-Type":["application/json"]}}
```

Output (measured in `caddy:2.10-alpine`, the image the host runs):

```
CLASS	browser	1
DAY	20717	browser	1
FILE	ssp-api.log	1	1790000000	1790000000
ROW	browser	GET	/api/inventory/{id}	200	1	1790000000	1790000000
SUMMARY	parsed	1	unparsed	0
```

An endpoint counts as unused only after this check comes back empty across
code, tests, docs, scripts, workflows and operations as well (removal rule,
ADR-0018).

## 4. Calibrate before trusting a run

Run the script locally on planted lines first:

```
docker run --rm -i -v <dir with ssp-api.log>:/data/access-logs:ro caddy:2.10-alpine sh -s < ops/epa/epa-aggregate.sh
```

Plant one line per class, one with a query string and one OAuth callback, and
check each lands in the expected `ROW` with nothing of the query in the
output. An empty directory must print `ERROR no log file` and exit 1; a file
of unparseable lines must print `ERROR no line parsed` and exit 1.

## 5. Turn the log off

Remove the block from the Caddyfile (maintenance-assistant PR), then on the
host: deploy the Caddyfile, `docker exec maintenance-caddy rm -r
/data/access-logs`, reload Caddy, and check that no new file appears.
