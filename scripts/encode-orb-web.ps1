param(
    [Parameter(Mandatory = $true)][string]$Frames,
    [string]$Destination = 'assets/magic-orb.webp'
)
$ErrorActionPreference = 'Stop'
$orbTools = Get-Content -LiteralPath (Join-Path $env:USERPROFILE 'Tools\DrinkShaker\installed-tools.json') -Raw | ConvertFrom-Json
$orbSource = (Resolve-Path -LiteralPath $Frames).Path
foreach ($orbIndex in 1..300) {
    if (-not (Test-Path -LiteralPath (Join-Path $orbSource ('orb_{0:D4}.png' -f $orbIndex)))) { throw 'All 300 original full-color frames are required.' }
}
& $orbTools.ffmpeg.path -hide_banner -loglevel error -y -framerate 25 -start_number 1 -i (Join-Path $orbSource 'orb_%04d.png') -frames:v 300 -vf 'scale=480:480:flags=lanczos' -c:v libwebp_anim -quality 78 -compression_level 5 -loop 0 -an $Destination
if ($LASTEXITCODE -ne 0) { throw 'WebP encoding failed.' }
$orbBytes = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Destination).Path)
$orbOffset = 12
$orbDurations = @()
while ($orbOffset + 8 -le $orbBytes.Length) {
    $orbTag = [Text.Encoding]::ASCII.GetString($orbBytes, $orbOffset, 4)
    $orbChunkSize = [BitConverter]::ToUInt32($orbBytes, $orbOffset + 4)
    if ($orbTag -eq 'ANMF') {
        $orbAt = $orbOffset + 20
        $orbDurations += [int]$orbBytes[$orbAt] + ([int]$orbBytes[$orbAt + 1] -shl 8) + ([int]$orbBytes[$orbAt + 2] -shl 16)
    }
    $orbOffset += 8 + $orbChunkSize + ($orbChunkSize % 2)
}
if ($orbDurations.Count -ne 300 -or @($orbDurations | Where-Object { $_ -ne 40 }).Count -gt 0) { throw 'Expected exactly 300 frames at 40 ms each.' }
if ($orbBytes.Length -gt 3000000) { throw 'Web delivery exceeded its 3 MB budget.' }
Write-Output "WebP ready: 480 x 480, 300 frames at 25 fps, 12 seconds, $($orbBytes.Length) bytes. Original GIF and smoke density are unchanged."
