<#
  Installs the official BUGEMCO logo into assets\img\logo-bugemco.png.

  The supplied file is a square PNG with the artwork sitting in a band across
  the middle and a large transparent margin all round. Placed as-is it would
  render as a small logo inside a big empty box, so this trims the transparent
  margin away and keeps a little breathing room.

  Usage:
      powershell -File tools\install-logo.ps1
      powershell -File tools\install-logo.ps1 -Source "C:\path\to\logo.png"
#>
param(
  [string]$Source = "$env:USERPROFILE\Pictures\logo.png",
  [int]$OutWidth = 900,
  [int]$AlphaThreshold = 12,
  [int]$PadPercent = 3
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) { throw "No logo found at $Source" }

$root = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $root 'assets\img\logo-bugemco.png'

$src = New-Object System.Drawing.Bitmap($Source)
"Source: $($src.Width) x $($src.Height)  $($src.PixelFormat)"

# Lock the bits and scan the alpha channel for the real edges of the artwork.
# GetPixel per pixel would take minutes on a 2100x2100 image.
$rect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
$data = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bytes = New-Object byte[] ($data.Stride * $src.Height)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$src.UnlockBits($data)

$minX = $src.Width; $minY = $src.Height; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $src.Height; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $src.Width; $x++) {
        # BGRA byte order; alpha is the fourth byte of each pixel.
        if ($bytes[$row + $x * 4 + 3] -gt $AlphaThreshold) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
if ($maxX -lt 0) { throw "The image is fully transparent - nothing to trim." }

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
"Artwork found at x $minX..$maxX, y $minY..$maxY  ($w x $h)"

$pad = [int][math]::Round([math]::Max($w, $h) * $PadPercent / 100)
$cx = [math]::Max(0, $minX - $pad)
$cy = [math]::Max(0, $minY - $pad)
$cw = [math]::Min($src.Width  - $cx, $w + $pad * 2)
$ch = [math]::Min($src.Height - $cy, $h + $pad * 2)

$outW = [math]::Min($OutWidth, $cw)
$outH = [int][math]::Round($ch * $outW / $cw)

$dst = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode  = 'HighQualityBicubic'
$g.SmoothingMode      = 'HighQuality'
$g.PixelOffsetMode    = 'HighQuality'
$g.CompositingQuality = 'HighQuality'
$g.DrawImage($src,
  (New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)),
  $cx, $cy, $cw, $ch, [System.Drawing.GraphicsUnit]::Pixel)

$dst.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $dst.Dispose(); $src.Dispose()

$kb = [math]::Round((Get-Item $out).Length / 1KB)
"Wrote assets\img\logo-bugemco.png  ${outW} x ${outH}  ${kb} KB (transparent background kept)"
