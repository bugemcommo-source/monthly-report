<#
  Prepares the July 2026 system screenshots for the report.

  Unlike optimize-screenshots.ps1, which resizes a whole folder into
  shot-01.jpg, shot-02.jpg..., this one names each image after the system it
  shows and CROPS it first.

  Five images this script used to produce are no longer published at all, and
  their entries have been removed from the job list below. Cropping was not
  enough for any of them: a crop removes what you can see and leaves the question
  of what the rest of the screen is drawn from. All are explained in the tracking
  files, which are the record. Do not restore them here.

  The remaining crops trim a browser-extension button that floats in the
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
# Five images this script used to produce have been deliberately removed from the
# published report and must not come back by re-running a tool.
#
#   - the CAC-IIS dashboard, withdrawn 16 September 2026. Its figures were recorded
#     as test data, but that was read off the screen and never confirmed, and the
#     same assumption proved wrong for another system. It returns only when the
#     owner confirms the data is invented.
#   - the Mart admin console, withdrawn 15 September 2026. That system runs on the
#     coop's actual data, so its figures were real.
#   - the Mart sign-in screen, withdrawn 16 September 2026 during the August publish
#     scan, for the same reason as the admin console. The report describes the screen
#     in words instead.
#   - the CreditMS dashboard, withdrawn 16 September 2026 during the August publish scan.
#     Inspected directly: it carries aggregate counts only — no member names, no account
#     numbers, no amounts. It was pulled because the "test data" label had never been
#     confirmed by the owner, the same standard applied to the CAC-IIS dashboard above.
#     It returns when the owner confirms the data is invented.
#   - the CreditMS sign-in screen, withdrawn 16 September 2026 alongside the dashboard.
#     Inspected directly: empty credential fields, but the splash panel beside them carries
#     a scorecard with a score on it, labelled "SAMPLE SCORECARD" on the screen. That label
#     is the same unconfirmed claim as the two entries above, and a score is closer to
#     application data than the dashboard's aggregates were. Pulled for consistency.
#
# These entries are deleted from the list below rather than commented out, because a
# commented line is one keystroke from running. See tracking/projects/cac-iis.md and
# tracking/projects/mart-online-store.md. Do not re-add any of them without the owner.
$jobs = @(
  @{ In='Screenshot 2026-08-06 210156.png'; Out='cacis-login.jpg';     CropH=1240; Why='trims the floating extension button' }
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
