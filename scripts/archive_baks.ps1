$ErrorActionPreference = 'Stop'
$archive = 'docs\_bak'
if (-not (Test-Path $archive)) {
    New-Item -ItemType Directory -Path $archive | Out-Null
}
$files = Get-ChildItem -Path .\docs -Recurse -Filter *.bak -File -ErrorAction SilentlyContinue
foreach ($f in $files) {
    $rel = $f.FullName.Substring((Get-Location).Path.Length + 1).TrimStart('\', '/')
    $dest = Join-Path $archive $rel
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Move-Item -Path $f.FullName -Destination $dest -Force
}

# Update .gitignore
$gitignorePath = '.gitignore'
$existing = @()
if (Test-Path $gitignorePath) { $existing = Get-Content $gitignorePath }
if ($existing -notcontains '/docs/_bak/') {
    Add-Content -Path $gitignorePath -Value "# archive of docs backups"
    Add-Content -Path $gitignorePath -Value "/docs/_bak/"
}

# Commit .gitignore if changed
git add .gitignore
$commitOutput = git commit -m "chore: archive docs .bak backups to docs/_bak and ignore" 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host $commitOutput } else { Write-Host "Committed .gitignore changes" }

git status --porcelain
