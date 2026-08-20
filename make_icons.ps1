Add-Type -AssemblyName System.Drawing

$iconsDir = "d:\Coding Projects\Chrome Extension\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$sizes = @(16, 48, 128)

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Background circle
    $rect = New-Object System.Drawing.Rectangle 0, 0, $s, $s
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillEllipse($bgBrush, $rect)

    # Lighting bolt polygon
    $fgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $p1 = New-Object System.Drawing.PointF ($s * 0.54), ($s * 0.14)
    $p2 = New-Object System.Drawing.PointF ($s * 0.22), ($s * 0.54)
    $p3 = New-Object System.Drawing.PointF ($s * 0.48), ($s * 0.54)
    $p4 = New-Object System.Drawing.PointF ($s * 0.44), ($s * 0.86)
    $p5 = New-Object System.Drawing.PointF ($s * 0.78), ($s * 0.44)
    $p6 = New-Object System.Drawing.PointF ($s * 0.52), ($s * 0.44)
    
    $pts = [System.Drawing.PointF[]]@($p1, $p2, $p3, $p4, $p5, $p6)
    $g.FillPolygon($fgBrush, $pts)

    $filePath = Join-Path $iconsDir "icon$s.png"
    $bmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $filePath"
}
