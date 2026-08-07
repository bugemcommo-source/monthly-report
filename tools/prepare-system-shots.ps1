<#
  Prepares the July 2026 system screenshots for the report.

  Unlike optimize-screenshots.ps1, which resizes a whole folder into
  shot-01.jpg, shot-02.jpg..., this one names each image after the system it
  shows and CROPS it first. The crop is the point: two of these screenshots
  carry things that must not go on a public website.

    mart-admin   - the bottom of the page is a "Watchlist" table listing real
                   members by name, with their account number and how much they
                   owe. Cropped off entirely.
    cacis-dash   - the bottom row breaks collections down branch by branch.
                   Internal financial detail; only the top row is kept.

  The rest of the crops trim a browser-extension button that floats in the
  bottom-right corner of every capture. It is not part of any of these systems
  and it looks like a defect when projected.

  Nothing is painted over and no figure is altered. Everything here removes
  whole regions from the edge of the frame.

  Usage: powershell -File tools\prepare-system-shots.ps1
#>
param(
  [string]$Source = "$env:USERPROFILE\Downloads",
  [int]$MaxWidth = 1600,
  [int]$Quality  = 86
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$dst  = Join-Path $root 'reports\2026-07-july\img'
$keep = Join-Path $root 'private\raw-screenshots\2026-07'
New-Item -ItemType Directory -Force -Path $dst, $keep | Out-Null

# file, output name, crop height in ORIGINAL pixels (width is always full)
$jobs = @(
  @{ In='Screenshot 2026-08-06 210156.png'; Out='cacis-login.jpg';     CropH=1240; Why='trims the floating extension button' }
  @{ In='Screenshot 2026-08-06 214057.png'; Out='cacis-dashboard.jpg'; CropH=800;  Why='keeps the top row only - drops the branch-by-branch collections chart' }
  @{ In='Screenshot 2026-08-06 211406.png'; Out='mart-login.jpg';      CropH=1255; Why='trims the floating extension button' }
  @{ In='Screenshot 2026-08-06 211521.png'; Out='mart-admin.jpg';      CropH=1120; Why='DROPS THE WATCHLIST - real member names, account numbers and balances' }
  @{ In='Screenshot 2026-08-06 212917.png'; Out='cms-login.jpg';       CropH=1250; Why='trims the floating extension button' }
  @{ In='Screenshot 2026-08-06 213121.png'; Out='cms-dashboard.jpg';   CropH=1250; Why='trims the floating extension button' }
)

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

$rows = @()
foreach ($j in $jobs) {
  $path = Join-Path $Source $j.In
  if (-not (Test-Path $path)) { throw "Missing: $path" }
  Copy-Item $path (Join-Path $keep $j.In) -Force

  $img = [System.Drawing.Image]::FromFile($path)
  try {
    $cropH = [math]::Min($j.CropH, $img.Height)
    $w = [math]::Min($MaxWidth, $img.Width)
    $h = [int][math]::Round($cropH * $w / $img.Width)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = 'HighQualityBicubic'
      $g.SmoothingMode     = 'HighQuality'
      $g.PixelOffsetMode   = 'HighQuality'
      $src  = New-Object System.Drawing.Rectangle(0, 0, $img.Width, $cropH)
      $dest = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
      $g.DrawImage($img, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $g.Dispose() }

    $out = Join-Path $dst $j.Out
    $bmp.Save($out, $codec, $ep)
    $bmp.Dispose()

    $rows += [pscustomobject]@{
      File   = $j.Out
      Was    = "$($img.Width)x$($img.Height)"
      Now    = "${w}x${h}"
      KB     = [math]::Round((Get-Item $out).Length / 1KB)
      Crop   = $j.Why
    }
  } finally { $img.Dispose() }
}

$rows | Format-Table -AutoSize -Wrap
"`nOriginals kept in $keep (gitignored, never uploaded)."
"Look at every file in $dst before this goes anywhere near the public site."
