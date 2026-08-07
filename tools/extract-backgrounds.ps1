# Pulls the three standard backgrounds out of the March template and writes
# web-sized JPEGs into assets\img\. Re-runnable and safe.
#
# The template is not kept in this repository. Pass its path when you run this:
#     powershell -File tools\extract-backgrounds.ps1 -Pptx '<path to the March .pptx>'
param([string]$Pptx)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root  = Split-Path -Parent $PSScriptRoot
if (-not $Pptx) { throw "Pass -Pptx with the path to the March monthly report PowerPoint." }
$pptx  = $Pptx
$work  = Join-Path $env:TEMP 'bugemco-bg'
$outDir = Join-Path $root 'assets\img'

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Force -Path $work, $outDir | Out-Null
Copy-Item $pptx (Join-Path $work 'src.zip')
Expand-Archive (Join-Path $work 'src.zip') (Join-Path $work 'x')

$map = @{ 'image2.png' = 'bg-title.jpg'; 'image1.png' = 'bg-content.jpg'; 'image9.png' = 'bg-closing.jpg' }
$targetWidth = 2560   # plenty for a 1080p or 1440p projector; ~7x smaller than source

foreach ($k in $map.Keys) {
    $src = Join-Path $work "x\ppt\media\$k"
    if (-not (Test-Path $src)) { throw "Missing $k in template" }
    $img = [System.Drawing.Image]::FromFile($src)
    $w = $targetWidth
    $h = [int][math]::Round($img.Height * $w / $img.Width)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($img, 0, 0, $w, $h)

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 86L)
    $bmp.Save((Join-Path $outDir $map[$k]), $codec, $ep)

    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    $sizeKb = [math]::Round((Get-Item (Join-Path $outDir $map[$k])).Length / 1KB)
    "$($map[$k])  ${w}x${h}  ${sizeKb} KB"
}
Remove-Item $work -Recurse -Force
