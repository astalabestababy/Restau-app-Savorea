Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-ArchPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = $Width / 2
  $path.AddArc($X, $Y, $Width, $Width, 180, 180)
  $path.AddLine($X + $Width, $Y + $radius, $X + $Width, $Y + $Height)
  $path.AddLine($X + $Width, $Y + $Height, $X, $Y + $Height)
  $path.AddLine($X, $Y + $Height, $X, $Y + $radius)
  $path.CloseFigure()

  return $path
}

function Draw-Logo {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size,
    [bool]$TransparentBackground = $false
  )

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $brandRed = [System.Drawing.Color]::FromArgb(196, 30, 67)
  $panelRed = [System.Drawing.Color]::FromArgb(181, 22, 46)
  $outlineRed = [System.Drawing.Color]::FromArgb(154, 18, 39)
  $white = [System.Drawing.Color]::White

  if (-not $TransparentBackground) {
    $Graphics.Clear($brandRed)
    $bgPath = New-RoundedRectPath -X 0 -Y 0 -Width $Size -Height $Size -Radius ($Size * 0.17)
    $bgBrush = New-Object System.Drawing.SolidBrush($brandRed)
    $Graphics.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()
    $bgPath.Dispose()
  } else {
    $Graphics.Clear([System.Drawing.Color]::Transparent)
  }

  $panelMargin = $Size * 0.10
  $panelWidth = $Size - ($panelMargin * 2)
  $panelHeight = $Size * 0.80
  $panelY = $Size * 0.08
  $panelPath = New-ArchPath -X $panelMargin -Y $panelY -Width $panelWidth -Height $panelHeight
  $panelBrush = New-Object System.Drawing.SolidBrush($panelRed)
  $Graphics.FillPath($panelBrush, $panelPath)
  $panelBrush.Dispose()

  $innerMargin = $Size * 0.11
  $innerWidth = $Size - ($innerMargin * 2)
  $innerHeight = $Size * 0.67
  $innerY = $Size * 0.18
  $innerPath = New-ArchPath -X $innerMargin -Y $innerY -Width $innerWidth -Height $innerHeight
  $outlinePen = New-Object System.Drawing.Pen($white, [float][Math]::Max(4, $Size * 0.004))
  $Graphics.DrawPath($outlinePen, $innerPath)

  $archY = $innerY + ($innerWidth * 0.03)
  $archPen = New-Object System.Drawing.Pen($white, [float][Math]::Max(3, $Size * 0.003))
  $Graphics.DrawArc($archPen, $innerMargin + ($innerWidth * 0.12), $archY, $innerWidth * 0.76, $innerWidth * 0.18, 200, 140)
  $dotBrush = New-Object System.Drawing.SolidBrush($white)
  $dotSize = $Size * 0.035
  $Graphics.FillEllipse($dotBrush, ($Size / 2) - ($dotSize / 2), $archY - ($dotSize * 0.35), $dotSize, $dotSize)

  $utensilPen = New-Object System.Drawing.Pen($white, [float][Math]::Max(10, $Size * 0.014))
  $utensilPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $utensilPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $forkX = $Size * 0.44
  $forkTop = $Size * 0.21
  $forkBottom = $Size * 0.65
  $Graphics.DrawLine($utensilPen, $forkX, $forkTop, $forkX, $forkBottom)
  foreach ($offset in @(-0.03, 0, 0.03)) {
    $x = $forkX + ($Size * $offset)
    $Graphics.DrawLine($utensilPen, $x, $forkTop, $x, $Size * 0.40)
  }

  $spoonX = $Size * 0.57
  $Graphics.DrawLine($utensilPen, $spoonX, $Size * 0.39, $spoonX, $forkBottom)
  $Graphics.DrawEllipse($utensilPen, $spoonX - ($Size * 0.055), $Size * 0.20, $Size * 0.11, $Size * 0.19)

  $titleFont = New-Object System.Drawing.Font('Georgia', [float]($Size * 0.085), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font('Georgia', [float]($Size * 0.045), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $center = New-Object System.Drawing.StringFormat
  $center.Alignment = [System.Drawing.StringAlignment]::Center
  $center.LineAlignment = [System.Drawing.StringAlignment]::Center

  $titleRect = New-Object System.Drawing.RectangleF(($Size * 0.20), ($Size * 0.69), ($Size * 0.60), ($Size * 0.11))
  $Graphics.DrawString('Savorea', $titleFont, $dotBrush, $titleRect, $center)

  $linePen = New-Object System.Drawing.Pen($white, [float][Math]::Max(2, $Size * 0.003))
  $Graphics.DrawLine($linePen, $Size * 0.23, $Size * 0.81, $Size * 0.77, $Size * 0.81)

  $subtitleRect = New-Object System.Drawing.RectangleF(($Size * 0.20), ($Size * 0.82), ($Size * 0.60), ($Size * 0.06))
  $Graphics.DrawString('RESTAURANT', $subtitleFont, $dotBrush, $subtitleRect, $center)

  $center.Dispose()
  $subtitleFont.Dispose()
  $titleFont.Dispose()
  $linePen.Dispose()
  $utensilPen.Dispose()
  $dotBrush.Dispose()
  $archPen.Dispose()
  $outlinePen.Dispose()
  $innerPath.Dispose()
  $panelPath.Dispose()
}

function Save-LogoPng {
  param(
    [string]$Path,
    [int]$Size,
    [bool]$TransparentBackground = $false
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Draw-Logo -Graphics $graphics -Size $Size -TransparentBackground:$TransparentBackground
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$assetsDir = Join-Path $PSScriptRoot '..\assets'

Save-LogoPng -Path (Join-Path $assetsDir 'icon.png') -Size 1024
Save-LogoPng -Path (Join-Path $assetsDir 'adaptive-icon.png') -Size 1024 -TransparentBackground:$true
Save-LogoPng -Path (Join-Path $assetsDir 'favicon.png') -Size 256

Write-Host 'Generated brand icon assets.'
