param([string]$BlenderPath, [switch]$RenderVehicles, [switch]$RenderScenes)
$ErrorActionPreference = 'Stop'
if (-not $BlenderPath) {
    $BlenderPath = (Get-Command blender -ErrorAction SilentlyContinue).Source
}
if (-not $BlenderPath) {
    $BlenderPath = Get-ChildItem "$env:ProgramFiles\Blender Foundation\Blender*\blender.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $BlenderPath -or -not (Test-Path -LiteralPath $BlenderPath)) {
    throw 'Blender was not found. Run this script with -BlenderPath followed by the full path to blender.exe.'
}
Push-Location $PSScriptRoot
try {
    $VehicleArgs = @('--background', '--factory-startup', '--python', 'assets-src/build_video_cars.py')
    if ($RenderVehicles) { $VehicleArgs += @('--', '--render') }
    & $BlenderPath @VehicleArgs
    if ($LASTEXITCODE -ne 0) { throw 'Vehicle build failed.' }
    & $BlenderPath --background --factory-startup --python assets-src/build_wilderness.py
    if ($LASTEXITCODE -ne 0) { throw 'Scenery build failed.' }
    & $BlenderPath --background --factory-startup --python assets-src/build_night.py
    if ($LASTEXITCODE -ne 0) { throw 'Night asset build failed.' }
    if ($RenderVehicles) {
        & $BlenderPath --background --factory-startup --python assets-src/render_ui.py
        if ($LASTEXITCODE -ne 0) { throw 'Garage thumbnail render failed.' }
    }
    if ($RenderScenes) {
        & $BlenderPath --background --factory-startup --python assets-src/render_wilderness.py
        if ($LASTEXITCODE -ne 0) { throw 'Scene render failed.' }
    }
    Write-Host 'Finished. Editable scenes are in assets-src; the game exports are in dist/assets.'
} finally { Pop-Location }
