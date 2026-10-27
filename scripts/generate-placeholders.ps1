# Generates placeholder brand art until the final Yuxi artwork is supplied.
# Run from the repository root: powershell -ExecutionPolicy Bypass -File scripts/generate-placeholders.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$mascotDir = Join-Path $root 'assets/mascot'
$imagesDir = Join-Path $root 'assets/images'
New-Item -ItemType Directory -Force -Path $mascotDir, $imagesDir | Out-Null

$background = [System.Drawing.ColorTranslator]::FromHtml('#0B0B0F')
$surface = [System.Drawing.ColorTranslator]::FromHtml('#15151C')
$surface2 = [System.Drawing.ColorTranslator]::FromHtml('#1E1E28')
$crimson = [System.Drawing.ColorTranslator]::FromHtml('#E11D2E')
$cream = [System.Drawing.ColorTranslator]::FromHtml('#F4F4F6')

function New-Brush([System.Drawing.Color]$color) {
    return New-Object System.Drawing.SolidBrush($color)
}

function Draw-Yuxi {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Size,
        [string]$Mood,
        [bool]$OpaqueBackground
    )

    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $Graphics.Clear([System.Drawing.Color]::Transparent)

    if ($OpaqueBackground) {
        $Graphics.Clear($background)
    }

    $scale = $Size / 1024.0
    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $radius = 410 * $scale

    $surfaceBrush = New-Brush $surface
    $outlinePen = New-Object System.Drawing.Pen($crimson, (10 * $scale))
    $Graphics.FillEllipse($surfaceBrush, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $Graphics.DrawEllipse($outlinePen, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))

    # Hair silhouette: a dark rounded shape with crimson tips.
    $hairBrush = New-Brush ([System.Drawing.ColorTranslator]::FromHtml('#101018'))
    $hairRect = New-Object System.Drawing.RectangleF(($cx - 330 * $scale), ($cy - 350 * $scale), (660 * $scale), (620 * $scale))
    $Graphics.FillEllipse($hairBrush, $hairRect)
    $tipBrush = New-Brush $crimson
    $Graphics.FillEllipse($tipBrush, ($cx - 330 * $scale), ($cy + 150 * $scale), (90 * $scale), (90 * $scale))
    $Graphics.FillEllipse($tipBrush, ($cx + 240 * $scale), ($cy + 150 * $scale), (90 * $scale), (90 * $scale))

    # Face plate.
    $faceBrush = New-Brush ([System.Drawing.ColorTranslator]::FromHtml('#2A2A36'))
    $Graphics.FillEllipse($faceBrush, ($cx - 250 * $scale), ($cy - 240 * $scale), (500 * $scale), (470 * $scale))

    # Eyes and expression.
    $eyeBrush = New-Brush $cream
    $eyeY = $cy - 80 * $scale
    $Graphics.FillEllipse($eyeBrush, ($cx - 135 * $scale), $eyeY, (55 * $scale), (80 * $scale))
    $Graphics.FillEllipse($eyeBrush, ($cx + 80 * $scale), $eyeY, (55 * $scale), (80 * $scale))

    if ($Mood -eq 'sleepy') {
        $Graphics.FillRectangle($surfaceBrush, ($cx - 145 * $scale), ($eyeY + 32 * $scale), (75 * $scale), (16 * $scale))
        $Graphics.FillRectangle($surfaceBrush, ($cx + 70 * $scale), ($eyeY + 32 * $scale), (75 * $scale), (16 * $scale))
    }

    $mouthPen = New-Object System.Drawing.Pen($crimson, (12 * $scale))
    if ($Mood -eq 'happy' -or $Mood -eq 'cheer') {
        $Graphics.DrawArc($mouthPen, ($cx - 70 * $scale), ($cy + 40 * $scale), (140 * $scale), (100 * $scale), 15, 150)
    } else {
        $Graphics.DrawLine($mouthPen, ($cx - 40 * $scale), ($cy + 90 * $scale), ($cx + 40 * $scale), ($cy + 90 * $scale))
    }

    # Signature red triangle hair clip.
    $triangle = @(
        (New-Object System.Drawing.PointF(($cx + 205 * $scale), ($cy - 330 * $scale))),
        (New-Object System.Drawing.PointF(($cx + 315 * $scale), ($cy - 160 * $scale))),
        (New-Object System.Drawing.PointF(($cx + 95 * $scale), ($cy - 160 * $scale)))
    )
    $Graphics.FillPolygon($tipBrush, $triangle)

    $surfaceBrush.Dispose()
    $outlinePen.Dispose()
    $hairBrush.Dispose()
    $tipBrush.Dispose()
    $faceBrush.Dispose()
    $eyeBrush.Dispose()
    $mouthPen.Dispose()
}

function Save-Yuxi {
    param([string]$Path, [int]$Size, [string]$Mood, [bool]$OpaqueBackground = $false)

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    Draw-Yuxi -Graphics $graphics -Size $Size -Mood $Mood -OpaqueBackground $OpaqueBackground
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

# Mascot expressions. Transparent 1024px placeholders as specified.
Save-Yuxi -Path (Join-Path $mascotDir 'yuxi-happy.png') -Size 1024 -Mood 'happy'
Save-Yuxi -Path (Join-Path $mascotDir 'yuxi-thinking.png') -Size 1024 -Mood 'thinking'
Save-Yuxi -Path (Join-Path $mascotDir 'yuxi-sleepy.png') -Size 1024 -Mood 'sleepy'
Save-Yuxi -Path (Join-Path $mascotDir 'yuxi-cheer.png') -Size 1024 -Mood 'cheer'
Save-Yuxi -Path (Join-Path $mascotDir 'yuxi-face-icon.png') -Size 1024 -Mood 'happy'

# Store icon: opaque background so launchers and stores render it correctly.
Save-Yuxi -Path (Join-Path $imagesDir 'icon.png') -Size 1024 -Mood 'happy' -OpaqueBackground $true
Save-Yuxi -Path (Join-Path $imagesDir 'splash-icon.png') -Size 512 -Mood 'happy'
Save-Yuxi -Path (Join-Path $imagesDir 'favicon.png') -Size 64 -Mood 'happy' -OpaqueBackground $true

# Adaptive icon foreground: transparent, content safely inside the 66% safe zone.
$foreground = New-Object System.Drawing.Bitmap 1024, 1024
$fg = [System.Drawing.Graphics]::FromImage($foreground)
Draw-Yuxi -Graphics $fg -Size 1024 -Mood 'happy' -OpaqueBackground $false
$safe = New-Object System.Drawing.Bitmap 1024, 1024
$safeGraphics = [System.Drawing.Graphics]::FromImage($safe)
$safeGraphics.Clear([System.Drawing.Color]::Transparent)
$safeGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
# Scale the artwork into the central safe zone.
$scaled = New-Object System.Drawing.Bitmap 680, 680
$scaledGraphics = [System.Drawing.Graphics]::FromImage($scaled)
$scaledGraphics.Clear([System.Drawing.Color]::Transparent)
$scaledGraphics.DrawImage($foreground, 0, 0, 680, 680)
$safeGraphics.DrawImage($scaled, 172, 172, 680, 680)
$safe.Save((Join-Path $imagesDir 'android-icon-foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$scaledGraphics.Dispose(); $scaled.Dispose(); $safeGraphics.Dispose(); $safe.Dispose(); $fg.Dispose(); $foreground.Dispose()

# Solid adaptive background.
$backgroundBitmap = New-Object System.Drawing.Bitmap 1024, 1024
$backgroundGraphics = [System.Drawing.Graphics]::FromImage($backgroundBitmap)
$backgroundGraphics.Clear($background)
$backgroundBitmap.Save((Join-Path $imagesDir 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$backgroundGraphics.Dispose(); $backgroundBitmap.Dispose()

# Monochrome adaptive icon (white glyph on transparent).
$mono = New-Object System.Drawing.Bitmap 1024, 1024
$monoGraphics = [System.Drawing.Graphics]::FromImage($mono)
$monoGraphics.Clear([System.Drawing.Color]::Transparent)
$monoGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$monoGraphics.FillEllipse($white, 232, 232, 560, 560)
$triangleMono = @(
    (New-Object System.Drawing.PointF(580, 310)),
    (New-Object System.Drawing.PointF(700, 500)),
    (New-Object System.Drawing.PointF(460, 500))
)
$monoGraphics.FillPolygon($white, $triangleMono)
$mono.Save((Join-Path $imagesDir 'android-icon-monochrome.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$white.Dispose(); $monoGraphics.Dispose(); $mono.Dispose()

# Notification icon: 96x96 all-white glyph on transparent background.
$notification = New-Object System.Drawing.Bitmap 96, 96
$ng = [System.Drawing.Graphics]::FromImage($notification)
$ng.Clear([System.Drawing.Color]::Transparent)
$ng.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$ng.FillEllipse($whiteBrush, 12, 12, 72, 72)
$triangleNotification = @(
    (New-Object System.Drawing.PointF(54, 28)),
    (New-Object System.Drawing.PointF(68, 52)),
    (New-Object System.Drawing.PointF(40, 52))
)
$ng.FillPolygon($whiteBrush, $triangleNotification)
$notification.Save((Join-Path $imagesDir 'notification-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$whiteBrush.Dispose(); $ng.Dispose(); $notification.Dispose()

Write-Host 'Placeholder artwork generated.'
