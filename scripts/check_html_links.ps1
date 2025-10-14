<#
.SYNOPSIS
    Check HTML files under a docs tree for broken local href/src targets and fragment anchors.

.DESCRIPTION
    Recursively scans *.html files under the provided path. For each href/src attribute that
    is a local file (not http(s), mailto, tel, or protocol-relative), it resolves the path
    and checks the file exists. For fragment links (containing #), it verifies the target
    file contains an element with matching id or name attributes.

.PARAMETER Path
    Root path to scan. Default: .\docs

.PARAMETER WhatIf
    Dry-run: do not write report file. Only print summary to console.

.PARAMETER Report
    Path to write missing-links report when not in WhatIf mode. Default: scripts\missing_html_links_report.txt

.PARAMETER MaxFileBytes
    Maximum file size (bytes) to read for HTML files (default 5MB). Larger files will be skipped.
#>

param(
    [string]$Path = '.\docs',
    [switch]$WhatIf,
    [string]$Report = 'scripts\\missing_html_links_report.txt',
    [int]$MaxFileBytes = 5242880,
    [int]$MaxFiles = 1000,
    [string[]]$ExcludeDirs = @('node_modules','polished','.vite','dist'),
    # When set, include empty href/src entries (default: do not report empty targets)
    [switch]$ReportEmpty,
    # When set, skip fragment-only links (e.g. '#section') which are common in single-page/generated ReDoc files
    [switch]$SkipReDoc
)

$base = (Get-Location).ProviderPath
$root = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
if (-not $root) { Write-Host "Path not found: $Path" -ForegroundColor Red; exit 2 }
$root = $root.Path

Write-Host "Scanning HTML under: $root" -ForegroundColor Cyan

# find html files (exclude generated folders)
 $allHtmls = Get-ChildItem -Path $root -Recurse -Filter '*.html' -File -ErrorAction SilentlyContinue
 Write-Host "Found html files (before exclude): $($allHtmls.Count)" -ForegroundColor DarkCyan
 $htmls = $allHtmls | Where-Object {
    $skip = $false
    foreach ($ex in $ExcludeDirs) {
        # normalize both sides to backslashes for predictable matching
        $norm = $ex -replace '/','\\'
        if ($_.FullName -like "*\\$norm\\*" -or $_.FullName -like "*$norm") { $skip = $true; break }
    }
    -not $skip
}
Write-Host "Html files after exclude: $($htmls.Count)" -ForegroundColor DarkCyan

# Safety: allow limiting number of files processed to avoid long / frozen runs
if ($MaxFiles -gt 0 -and $htmls.Count -gt $MaxFiles) {
    Write-Host "Limiting processing to first $MaxFiles files (of $($htmls.Count))." -ForegroundColor Yellow
    $htmls = $htmls[0..($MaxFiles - 1)]
}
if (-not $htmls -or $htmls.Count -eq 0) { Write-Host "No HTML files found under $root" -ForegroundColor Yellow; exit 0 }

$missing = @()

$totalFiles = $htmls.Count
$count = 0
foreach ($f in $htmls) {
    $count++
    if (($count % 25) -eq 0 -or $count -eq 1 -or $count -eq $totalFiles) {
        $pct = [int](($count / $totalFiles) * 100)
        Write-Progress -Activity 'Checking HTML links' -Status "Processing $count of $totalFiles" -PercentComplete $pct
    }
    try {
        if ($f.Length -gt $MaxFileBytes) {
            Write-Host "Skipping large file: $($f.FullName) ($($f.Length) bytes)" -ForegroundColor Yellow
            continue
        }
        $text = Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop
    } catch {
        Write-Host "Failed to read: $($f.FullName) -> $_" -ForegroundColor Yellow
        continue
    }

    # regex to capture href or src values (handles double-quoted, single-quoted, or unquoted)
    # use single-quoted outer string and double single-quotes to represent a single-quoted alternation
    $pattern = '(?i)\b(?:href|src)\s*=\s*(?:"([^"]*)"|''([^'']*)''|([^>\s]+))'
    $matches = [regex]::Matches($text, $pattern)
    foreach ($m in $matches) {
        $target = $null
        if ($m.Groups[2].Success) { $target = $m.Groups[2].Value }
        elseif ($m.Groups[3].Success) { $target = $m.Groups[3].Value }
        elseif ($m.Groups[4].Success) { $target = $m.Groups[4].Value }
        if (-not $target) { $target = '' }
        $target = $target.Trim()

        # skip absolute web or protocol links and data URIs and javascript pseudo-links
    if ($target -match '^(?i)(http:|https:|mailto:|tel:|data:|//|javascript:)') { continue }
        # if target empty after trimming, skip by default (common in generated ReDoc); record only when -ReportEmpty is set
        if ([string]::IsNullOrWhiteSpace($target)) {
            if ($ReportEmpty) {
                $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'href/src'; Target = $target; Resolved = '' }
            }
            continue
        }

        # handle fragment-only links (e.g. #section)
        if ($target.StartsWith('#')) {
            # If user asked to skip ReDoc-style fragments entirely, respect that
            if ($SkipReDoc) { continue }
            $frag = $target.TrimStart('#')
            # empty fragment (href="#") is very common in generated ReDoc; treat as empty unless -ReportEmpty
            if ([string]::IsNullOrWhiteSpace($frag)) {
                if ($ReportEmpty) { $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'fragment'; Target = $target; Resolved = $f.FullName } }
                continue
            }
            # check current file for anchor (id or name)
            $esc = [regex]::Escape($frag)
            # build a safe regex with the escaped fragment inserted
            $rxFrag = '(?i)\b(id|name)\s*=\s*(?:"{0}"|''{0}'')' -f $esc
            if (-not [regex]::IsMatch($text, $rxFrag)) {
                $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'fragment'; Target = $target; Resolved = $f.FullName }
            }
            continue
        }

        # resolve path
    $filePart = ($target -split '#')[0]
        if ($filePart.StartsWith('/')) {
            # repo-root relative
            $fileCandidate = Join-Path $base ($filePart.TrimStart('/').Replace('/','\\'))
        } else {
            $fileCandidate = Join-Path $f.DirectoryName ($filePart.Replace('/','\\'))
        }
        $fileCandidate = [System.IO.Path]::GetFullPath($fileCandidate)

        if (-not (Test-Path -LiteralPath $fileCandidate)) {
            # Try fallback if no extension: look for index.html or README.html
            $found = $false
            if (-not ([System.IO.Path]::GetExtension($fileCandidate))) {
                $altIndex = Join-Path $fileCandidate 'index.html'
                $altReadme = Join-Path $fileCandidate 'README.html'
                if ((Test-Path -LiteralPath $altIndex) -or (Test-Path -LiteralPath $altReadme)) { $found = $true }
                $altHtml = $fileCandidate + '.html'
                if ((Test-Path -LiteralPath $altHtml)) { $found = $true; $fileCandidate = $altHtml }
            }
            if (-not $found) {
                $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'href/src'; Target = $target; Resolved = $fileCandidate }
                continue
            }
        }

        # if fragment present in target, validate anchor in target file
        if ($target -match '#') {
            $frag = ($target -split '#')[-1]
            $targetFile = $fileCandidate
            # read target file safely
            try {
                $tInfo = Get-Item -LiteralPath $targetFile -ErrorAction Stop
                if ($tInfo.Length -gt $MaxFileBytes) {
                    Write-Host "Skipping fragment check for large target: $targetFile" -ForegroundColor Yellow
                    continue
                }
                $tText = Get-Content -LiteralPath $targetFile -Raw -ErrorAction Stop
            } catch {
                $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'fragment'; Target = $target; Resolved = $targetFile }
                continue
            }
            $escaped = [regex]::Escape($frag)
            $rx = '(?i)\b(id|name)\s*=\s*(?:"{0}"|''{0}'')' -f $escaped
            if (-not [regex]::IsMatch($tText, $rx)) {
                $missing += [PSCustomObject]@{ Source = $f.FullName; Attr = 'fragment'; Target = $target; Resolved = $targetFile }
            }
        }
    }
}

if ($missing.Count -eq 0) {
    Write-Host "No missing HTML links found under $root" -ForegroundColor Green
} else {
    Write-Host "Missing HTML links found: $($missing.Count)" -ForegroundColor Red
    $lines = @()
    $i = 1
    foreach ($it in ($missing | Sort-Object Source)) {
        $line = "[$i] Source: $($it.Source)`n    Attr: $($it.Attr)`n    Target: $($it.Target)`n    Resolved: $($it.Resolved)`n"
        $lines += $line
        Write-Host $line
        $i++
    }
    if (-not $WhatIf) {
        $outPath = Join-Path $base $Report
        ($lines -join "`r`n") | Out-File -FilePath $outPath -Encoding UTF8
        Write-Host "Full report written to: $outPath" -ForegroundColor Cyan
    } else {
        Write-Host "(Dry-run) Run script without -WhatIf to write report to $Report" -ForegroundColor Cyan
    }
}

Write-Host "Scan complete." -ForegroundColor Cyan

exit 0
