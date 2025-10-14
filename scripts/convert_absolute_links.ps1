<#
.SYNOPSIS
    Convert absolute site-root links under /docs/ and /architecture/ in Markdown and HTML files to relative links when the target exists.

.DESCRIPTION
    This script scans files under the repository for links that start with '/docs/' or '/architecture/' and, when the target file
    exists under the repo's docs tree, replaces the leading absolute path with a conservative relative path from the source file.

.PARAMETER Path
    Root path to scan. Default: .\docs

.PARAMETER WhatIf
    If provided, run in dry-run mode and report changes but do not write files.

.EXAMPLE
    .\scripts\convert_absolute_links.ps1 -Path .\docs

#>
<#
.SYNOPSIS
    Convert absolute site-root links under /docs/ and /architecture/ in Markdown and HTML files to relative links when the target exists.

.DESCRIPTION
    This script scans files under the repository for links that start with '/docs/' or '/architecture/' and, when the target file
    exists under the repo's docs tree, replaces the leading absolute path with a conservative relative path from the source file.

.PARAMETER Path
    Root path to scan. Default: .\docs

.PARAMETER WhatIf
    If provided, run in dry-run mode and report changes but do not write files.

.EXAMPLE
    .\scripts\convert_absolute_links.ps1 -Path .\docs -WhatIf

#>

param(
    [string]$Path = '.\docs',
    [switch]$WhatIf
)

Write-Host "Scanning path: $Path" -ForegroundColor Cyan

# Find candidate files
$patterns = @('*.md','*.markdown','*.html')
$files = Get-ChildItem -Path $Path -Recurse -Include $patterns -File | Where-Object { $_.Length -gt 0 -and $_.FullName -notmatch '\\node_modules\\' }

if ($files.Count -eq 0) {
    Write-Host "No files found under $Path" -ForegroundColor Yellow
    exit 0
}

$updated = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
    $original = Get-Content -Raw -Path $file.FullName -ErrorAction SilentlyContinue
    if (-not $original) { continue }
    $text = $original

    # Helper: Get relative path compatible with older PowerShell/.NET
    function Get-RelativePath([string]$fromDir, [string]$toPath) {
        # Ensure full paths and trailing slash for directory
        $fromFull = [System.IO.Path]::GetFullPath($fromDir)
        if ($fromFull[-1] -ne [System.IO.Path]::DirectorySeparatorChar) { $fromFull = $fromFull + [System.IO.Path]::DirectorySeparatorChar }
        $toFull = [System.IO.Path]::GetFullPath($toPath)
        try {
            $uriFrom = New-Object System.Uri($fromFull)
            $uriTo = New-Object System.Uri($toFull)
            $relUri = $uriFrom.MakeRelativeUri($uriTo).ToString()
            # Convert URI separators to OS separators then to forward slashes for markdown
            $rel = $relUri -replace '/', [System.IO.Path]::DirectorySeparatorChar
            $rel = $rel -replace "\\", '/'
            return $rel
        } catch {
            # Fallback: naive approach
            $fromParts = $fromFull -split '[\\/]+' | Where-Object { $_ -ne '' }
            $toParts = $toFull -split '[\\/]+' | Where-Object { $_ -ne '' }
            $i = 0
            while ($i -lt $fromParts.Length -and $i -lt $toParts.Length -and $fromParts[$i].ToLower() -eq $toParts[$i].ToLower()) { $i++ }
            $up = '..\' * ($fromParts.Length - $i)
            $remaining = ($toParts[$i..($toParts.Length-1)] -join '\\')
            $relPath = ($up + $remaining) -replace "\\", '/'
            return $relPath
        }
    }

    # Markdown links: ( /docs/... ) or ( /architecture/... )
    $mdPattern = '\(\s*/(docs|architecture)/([^\)\s]+)\s*\)'
    $text = [regex]::Replace($text, $mdPattern, [System.Text.RegularExpressions.MatchEvaluator]{
        param($m)
        $section = $m.Groups[1].Value
        $target = $m.Groups[2].Value -replace '\\','/'
        $targetRel = if ($section -eq 'docs') { "docs/$target" } else { "docs/architecture/$target" }
        $targetFull = Join-Path -Path (Get-Location) -ChildPath $targetRel
        if (Test-Path $targetFull) {
            $resolved = (Resolve-Path $targetFull).Path
            $rel = Get-RelativePath $file.DirectoryName $resolved
            return "($rel)"
        } else {
            $skipped.Add("$($file.FullName) -> $targetRel") | Out-Null
            return $m.Value
        }
    })

    # HTML href with double quotes: href="/docs/..." or href="/architecture/..."
    $doubleHtml = 'href\s*=\s"\/(docs|architecture)\/([^"\s>]+)"'
    $text = [regex]::Replace($text, $doubleHtml, [System.Text.RegularExpressions.MatchEvaluator]{
        param($m)
        $section = $m.Groups[1].Value
        $target = $m.Groups[2].Value -replace '\\','/'
        $targetRel = if ($section -eq 'docs') { "docs/$target" } else { "docs/architecture/$target" }
        $targetFull = Join-Path -Path (Get-Location) -ChildPath $targetRel
        if (Test-Path $targetFull) {
            $resolved = (Resolve-Path $targetFull).Path
            $rel = Get-RelativePath $file.DirectoryName $resolved
            return ('href="' + $rel + '"')
        } else {
            $skipped.Add("$($file.FullName) -> $targetRel") | Out-Null
            return $m.Value
        }
    })

    # HTML href with single quotes: href='/docs/...' or href='/architecture/...'
    $singleHtml = "href\s*=\s'\/(docs|architecture)\/([^'\s>]+)'"
    $text = [regex]::Replace($text, $singleHtml, [System.Text.RegularExpressions.MatchEvaluator]{
        param($m)
        $section = $m.Groups[1].Value
        $target = $m.Groups[2].Value -replace '\\','/'
        $targetRel = if ($section -eq 'docs') { "docs/$target" } else { "docs/architecture/$target" }
        $targetFull = Join-Path -Path (Get-Location) -ChildPath $targetRel
        if (Test-Path $targetFull) {
            $resolved = (Resolve-Path $targetFull).Path
            $rel = Get-RelativePath $file.DirectoryName $resolved
            return ("href='" + $rel + "'")
        } else {
            $skipped.Add("$($file.FullName) -> $targetRel") | Out-Null
            return $m.Value
        }
    })

    if ($text -ne $original) {
        if ($WhatIf) {
            Write-Host "[DRY-RUN] Would update: $($file.FullName)" -ForegroundColor Green
            $updated.Add($file.FullName) | Out-Null
        } else {
            Copy-Item -Path $file.FullName -Destination "$($file.FullName).bak" -Force
            Set-Content -Path $file.FullName -Value $text -Force
            Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
            $updated.Add($file.FullName) | Out-Null
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Files updated: $($updated.Count)"
if ($skipped.Count -gt 0) {
    Write-Host "Links skipped (target not found):" -ForegroundColor Yellow
    $skipped | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }
}

exit 0
