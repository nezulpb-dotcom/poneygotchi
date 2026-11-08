param(
    [string]$Cli = "arduino-cli",
    [string]$ConfigFile,
    [string]$OutputDir = "$PSScriptRoot/build"
)

$ErrorActionPreference = "Stop"
$config = @()
if ($ConfigFile) {
    $config = @("--config-file", $ConfigFile)
}
$setup = Join-Path $PSScriptRoot "crowpanel_v22.h"
$flags = 'compiler.cpp.extra_flags=-include "' + $setup + '"'
& $Cli @config compile --fqbn esp32:esp32:esp32:PSRAM=enabled `
    --build-property $flags --output-dir $OutputDir `
    (Join-Path $PSScriptRoot "PonyGotchi_Studio_CrowPanel")
exit $LASTEXITCODE
