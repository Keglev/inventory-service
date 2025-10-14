<#
.SYNOPSIS
  Lightweight HTML-only link checker for docs/ (PowerShell)

.DESCRIPTION
  Scans HTML files under a path, resolves local href/src targets, and reports missing files or missing fragment anchors.
  Designed to be simple and robust: avoids scanning external protocols, supports skip-lists and a --WhatIf dry-run.

.NOTES
  - Use PowerShell only (no Python). Default path: ./docs
  - This is a compact replacement for the previous script; intentionally minimal.
#>

param(
    [string]$Path = '.\docs',
    [switch]$WhatIf,
    [int]$MaxFiles = 1000,
    [int]$MaxFileBytes = 5MB,
    [string[]]$ExcludeDirs = @('node_modules','dist','.vite'),
    [switch]$SkipReDoc
)

Set-StrictMode -Version Latest
$base = (Get-Location).ProviderPath
$rootItem = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
if (-not $rootItem) { Write-Host "Path not found: $Path" -ForegroundColor Red; exit 2 }
$root = $rootItem.Path

Write-Host "Scanning HTML under: $root" -ForegroundColor Cyan

$all = Get-ChildItem -Path $root -Recurse -Filter *.html -File -ErrorAction SilentlyContinue
$htmls = $all | Where-Object {
    $skip = $false
    foreach ($ex in $ExcludeDirs) {
        $norm = $ex -replace '/','\\'
        if ($_.FullName -like "*\\$norm\\*" -or $_.FullName -like "*$norm") { $skip = $true; break }
    }
    -not $skip
}

if (-not $htmls -or $htmls.Count -eq 0) { Write-Host "No HTML files found under $root" -ForegroundColor Yellow; exit 0 }
if ($MaxFiles -gt 0 -and $htmls.Count -gt $MaxFiles) { $htmls = $htmls[0..($MaxFiles - 1)]; Write-Host "Limiting to $($htmls.Count) files" -ForegroundColor Yellow }

$missing = [System.Collections.ArrayList]::new()

foreach ($f in $htmls) {
    try {
        if ($f.Length -gt $MaxFileBytes) { Write-Host "Skipping large file: $($f.FullName)"; continue }
        $text = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop
    } catch { Write-Host "Failed reading $($f.FullName): $_" -ForegroundColor Yellow; continue }

    $pattern = '(?i)\b(?:href|src)\s*=\s*(?:"([^"]*)"|''([^'']*)''|([^>\s]+))'
    $matches = [regex]::Matches($text, $pattern)
    foreach ($m in $matches) {
        $t = if ($m.Groups[1].Success) { $m.Groups[1].Value } elseif ($m.Groups[2].Success) { $m.Groups[2].Value } else { $m.Groups[3].Value }
        if (-not $t) { $t = '' }
        $t = $t.Trim()
        if ($t -match '^(?i)(http:|https:|mailto:|tel:|data:|//|javascript:|#)') {
            if ($t.StartsWith('#')) {
                if ($SkipReDoc) { continue }
                $frag = $t.TrimStart('#')
                if (-not [string]::IsNullOrWhiteSpace($frag)) {
                    $escFrag = [regex]::Escape($frag)
                    $fragRx = '(?i)\b(id|name)\s*=\s*(?:"{0}"|''{0}'')' -f $escFrag
                    if (-not [regex]::IsMatch($text, $fragRx)) {
                        $null = $missing.Add([pscustomobject]@{ Source=$f.FullName; Attr='fragment'; Target=$t; Resolved=$f.FullName })
                    }
                }
                continue
            }
            continue
        }

        # resolve file path (strip fragment)
        $filePart = ($t -split '#')[0]
        $candidate = if ($filePart.StartsWith('/')) { Join-Path $base ($filePart.TrimStart('/').Replace('/','\\')) } else { Join-Path $f.DirectoryName ($filePart.Replace('/','\\')) }
        $candidate = [System.IO.Path]::GetFullPath($candidate)
        if (-not (Test-Path -LiteralPath $candidate)) {
            # try fallback index or README
            $found = $false
            if (-not ([System.IO.Path]::GetExtension($candidate))) {
                if (Test-Path -LiteralPath (Join-Path $candidate 'index.html')) { $found = $true }
                if (Test-Path -LiteralPath (Join-Path $candidate 'README.html')) { $found = $true }
                if (Test-Path -LiteralPath ($candidate + '.html')) { $found = $true; $candidate = $candidate + '.html' }
            }
            if (-not $found) { $null = $missing.Add([pscustomobject]@{ Source=$f.FullName; Attr='href/src'; Target=$t; Resolved=$candidate }); continue }
        }

        # if fragment included, check anchor in target file
        if ($t -match '#') {
            $frag = ($t -split '#')[-1]
            try {
                $tText = Get-Content -LiteralPath $candidate -Raw -ErrorAction Stop
            } catch { $null = $missing.Add([pscustomobject]@{ Source=$f.FullName; Attr='fragment'; Target=$t; Resolved=$candidate }); continue }
            $esc = [regex]::Escape($frag)
                $fragRx = '(?i)\b(id|name)\s*=\s*(?:"{0}"|''{0}'')' -f $esc
                if (-not [regex]::IsMatch($tText, $fragRx)) { $null = $missing.Add([pscustomobject]@{ Source = $f.FullName; Attr = 'fragment'; Target = $t; Resolved = $candidate }) }
        }
    }
}

if ($missing.Count -eq 0) { Write-Host "No missing HTML links found under $root" -ForegroundColor Green } else {
    Write-Host "Missing HTML links found: $($missing.Count)" -ForegroundColor Red
    $i=1
    foreach ($it in $missing) { Write-Host "[$i] $($it.Source) -> $($it.Attr) -> $($it.Target) -> $($it.Resolved)" ; $i++ }
    if (-not $WhatIf) { $out = Join-Path $base 'scripts\missing_html_links_report.txt'; $missing | Out-File -FilePath $out -Encoding UTF8 ; Write-Host "Full report written to: $out" -ForegroundColor Cyan }
}

Write-Host 'Scan complete.' -ForegroundColor Cyan
exit 0
