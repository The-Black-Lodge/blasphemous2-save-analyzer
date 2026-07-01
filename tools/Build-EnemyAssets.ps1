# Generate enemy display metadata and best-guess cropped sprites.
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "build-enemy-assets.py"
python $script
