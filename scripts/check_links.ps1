$base = Get-Location
Write-Host "Scanning docs/architecture for Markdown links...`n"
$pattern = '\[[^\]]+\]\(([^)]+)\)'
$missing = @()

$root = Join-Path $base 'docs\architecture'
Get-ChildItem -Path $root -Recurse -Filter *.md | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -LiteralPath $file -Raw
    $matches = [regex]::Matches($content, $pattern)
    foreach ($m in $matches) {
        $target = $m.Groups[1].Value.Trim()
        # skip absolute web links and pure anchors
        if ($target -match '^(http:|https:|#)') { continue }

    # normalize slashes and remove only leading './' ('.\\') sequences but keep '../' ("..\\")
    $targetClean = $target -replace '/', '\\'
        # remove any leading single-dot directory markers ('.\') but preserve parent '..\'
        while ($targetClean.StartsWith('.\')) {
            $targetClean = $targetClean.Substring(2)
        }

        # If the link begins with a leading slash, treat it as repo-root relative
        # (e.g., /Dockerfile -> <repo-root>/Dockerfile). Otherwise resolve
        # relative to the source file's folder.
        if ($targetClean.StartsWith('\')) {
            $rootRelative = $targetClean.TrimStart('\')
            $resolvedCandidate = Join-Path $base $rootRelative
        $base = Get-Location
        Write-Host "Scanning docs/architecture for Markdown links...`n"
        $pattern = '\[[^\]]+\]\(([^)]+)\)'
        $missing = @()

        $root = Join-Path $base 'docs\architecture'
        Get-ChildItem -Path $root -Recurse -Filter *.md | ForEach-Object {
            $file = $_.FullName
            $content = Get-Content -LiteralPath $file -Raw
            $matches = [regex]::Matches($content, $pattern)
            foreach ($m in $matches) {
                $target = $m.Groups[1].Value.Trim()
                # skip absolute web links and pure anchors
                if ($target -match '^(http:|https:|#)') { continue }

            # normalize slashes and remove only leading './' ('.\\') sequences but keep '../' ("..\\")
            $targetClean = $target -replace '/', '\\'
                # remove any leading single-dot directory markers ('.\') but preserve parent '..\'
                while ($targetClean.StartsWith('.\')) {
                    $targetClean = $targetClean.Substring(2)
                }

                # If the link begins with a leading slash, treat it as repo-root relative
                # (e.g., /Dockerfile -> <repo-root>/Dockerfile). Otherwise resolve
                # relative to the source file's folder.
                if ($targetClean.StartsWith('\')) {
                    $rootRelative = $targetClean.TrimStart('\')
                    $resolvedCandidate = Join-Path $base $rootRelative
                }
                else {
                    $resolvedCandidate = Join-Path (Split-Path $file) $targetClean
                }
                # separate anchor if present
                $resolvedFile = ($resolvedCandidate -split '#')[0]

                if ([string]::IsNullOrWhiteSpace($resolvedFile)) {
                    $missing += [PSCustomObject]@{ Source = $file; Target = $target; Resolved = $resolvedFile }
                    continue
                }

                # quick exists check
                if (Test-Path -LiteralPath $resolvedFile -PathType Any) { continue }

                $found = $false

                # if the target looks like a directory (no extension), try README/index fallbacks
                if (-not ($resolvedFile -match '\\.[^\\/]+$')) {
                    $dir = $resolvedFile
                    $altReadme = Join-Path $dir 'README.md'
                    $altIndex = Join-Path $dir 'index.md'
                    if ( (Test-Path -LiteralPath $altReadme -PathType Leaf) -or (Test-Path -LiteralPath $altIndex -PathType Leaf) ) {
                        $found = $true
                    }
                }

                # try adding .md when target appears to be a file without extension
                if (-not $found -and -not ($resolvedFile -match '\\.md$')) {
                    $withMd = $resolvedFile + '.md'
                    if (Test-Path -LiteralPath $withMd -PathType Leaf) { $found = $true }
                }

                if (-not $found) {
                    $missing += [PSCustomObject]@{ Source = $file; Target = $target; Resolved = $resolvedFile }
                }
            }
        }

        if ($missing.Count -eq 0) {
            Write-Host "No missing local links found under docs/architecture." -ForegroundColor Green
        } else {
            Write-Host "Missing local links:" -ForegroundColor Red
            $reportPath = Join-Path $base 'scripts\missing_links_report.txt'
            # prepare a compact, non-truncated report
            $lines = @()
            $i = 1
            foreach ($it in ($missing | Sort-Object Source)) {
                $line = "[$i] Source: $($it.Source)`n    Target: $($it.Target)`n    Resolved: $($it.Resolved)`n"
                $lines += $line
                Write-Host $line
                $i++
            }
            # save report
            $lines -join "`r`n" | Out-File -FilePath $reportPath -Encoding UTF8
            Write-Host "Full report written to: $reportPath" -ForegroundColor Cyan
        }

        Write-Host "`nScan complete." -ForegroundColor Cyan