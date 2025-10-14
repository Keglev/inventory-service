# Check PowerShell syntax for all scripts in scripts/ and report parse errors (non-interactive)
$files = Get-ChildItem -Path (Join-Path (Get-Location) 'scripts') -Filter *.ps1 | Sort-Object Name
foreach ($f in $files) {
    $errors = $null
    try {
        [System.Management.Automation.Language.Parser]::ParseFile($f.FullName, [ref]$null, [ref]$errors) | Out-Null
        if ($errors -and $errors.Count -gt 0) {
            Write-Output "$($f.Name): PARSE_ERRORS"
            foreach ($e in $errors) { Write-Output "  $($e.Message) (Line $($e.Extent.StartLineNumber))" }
        } else {
            Write-Output "$($f.Name): OK"
        }
    } catch {
        Write-Output "$($f.Name): EXCEPTION - $($_.Exception.Message)"
    }
}
