param([string]$Destination = "../etoilebois-phase-d3-3-grand-village.zip")
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $project
try {
    $dirty = @(git status --porcelain)
    if ($LASTEXITCODE -ne 0 -or $dirty.Count -gt 0) {
        throw 'Le checkout doit être propre et tous les livrables commités avant archivage.'
    }
    $target = [System.IO.Path]::GetFullPath((Join-Path $project $Destination))
    if ([System.IO.Path]::GetExtension($target) -ne '.zip') { throw 'Une destination ZIP est requise.' }
    if (Test-Path -LiteralPath $target) { throw 'La destination existe déjà ; choisir un autre nom.' }
    git archive --format=zip --prefix=etoilebois-phase-d3-3/ --output=$target HEAD
    if ($LASTEXITCODE -ne 0) { throw 'git archive a échoué.' }
    [PSCustomObject]@{Path=$target;Bytes=(Get-Item -LiteralPath $target).Length;SHA256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash;Commit=(git rev-parse HEAD)} | ConvertTo-Json
} finally { Pop-Location }

