<#
  Takes whatever is in intake\<month>\ and writes web-sized JPEGs into
  reports\<folder>\img\ with tidy names.

  Originals are copied to private\raw-screenshots\<month>\ first, so nothing
  is ever lost and the untouched versions never reach the public repo.

  Usage:
    powershell -File tools\optimize-screenshots.ps1 -Month 2026-07 -ReportFolder 2026-07-july
#>
param(
  [Parameter(Mandatory)][string]$Month,
  [Parameter(Mandatory)][string]$ReportFolder,
  [int]$MaxWidth = 1800,
  [int]$Quality = 82
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$src    = Join-Path $root "intake\$Month"
$dst    = Join-Path $root "reports\$ReportFolder\img"
$keep   = Join-Path $root "private\raw-screenshots\$Month"

if (-not (Test-Path $src)) { throw "No such folder: $src. Put this month's screenshots there first." }
New-Item -ItemType Directory -Force -Path $dst, $keep | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

$i = 0
$report = @()
Get-ChildItem $src -File -Include *.png,*.jpg,*.jpeg,*.bmp -Recurse | Sort-Object Name | ForEach-Object {
    $i++
    Copy-Item $_.FullName (Join-Path $keep $_.Name) -Force

    $img = [System.Drawing.Image]::FromFile($_.FullName)
    $w = [math]::Min($MaxWidth, $img.Width)
    $h = [int][math]::Round($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h)

    $name = 'shot-{0:d2}.jpg' -f $i
    $out = Join-Path $dst $name
    $bmp.Save($out, $codec, $ep)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()

    $before = [math]::Round($_.Length / 1KB)
    $after  = [math]::Round((Get-Item $out).Length / 1KB)
    $report += [pscustomobject]@{ New = $name; Original = $_.Name; Size = "${w}x${h}"; BeforeKB = $before; AfterKB = $after }
}

if ($i -eq 0) { throw "No image files found in $src" }
$report | Format-Table -AutoSize
$totalBefore = ($report | Measure-Object BeforeKB -Sum).Sum
$totalAfter  = ($report | Measure-Object AfterKB  -Sum).Sum
"`n$i screenshots. $totalBefore KB -> $totalAfter KB ($([math]::Round(100 - 100*$totalAfter/$totalBefore))% smaller)."
"Originals kept in: $keep (never uploaded)"
"`nNEXT: look at every file in $dst and confirm none of them show member names, account numbers, or amounts."
