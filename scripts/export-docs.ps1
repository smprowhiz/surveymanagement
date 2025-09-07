param(
  [string[]]$Files = @(
    "docs/Project-Overview-and-Onboarding.md",
    "docs/functional-coverage.md"
  ),
  [string]$OutDir = "exports"
)

$ErrorActionPreference = 'Stop'

# Ensure output directory exists
$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Path $workspace -Parent)
$projRoot = Join-Path (Get-Location) "SurveyManagement/SurveyProject"
Set-Location $projRoot

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

function Test-CommandExists {
  param([string]$cmd)
  $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

$hasPandoc = Test-CommandExists 'pandoc'
if (-not $hasPandoc) {
  Write-Warning "pandoc not found. You can still open the .md files in Word and 'Save As' .docx/PDF."
  Write-Output "Markdown files to share:" 
  $Files | ForEach-Object { Write-Output (Resolve-Path $_) }
  return
}

foreach ($file in $Files) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension($file)
  $docx = Join-Path $OutDir ("$name.docx")
  $pdf  = Join-Path $OutDir ("$name.pdf")

  Write-Host "Exporting $file -> $docx"
  pandoc $file -o $docx

  Write-Host "Exporting $file -> $pdf"
  pandoc $file -o $pdf
}

Write-Host "Done. Outputs in: $(Resolve-Path $OutDir)"
