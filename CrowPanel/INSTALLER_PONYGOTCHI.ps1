param(
    [string]$Port,
    [switch]$Verifier,
    [string]$Esptool
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Commande interrompue (code $LASTEXITCODE)." }
}

function Test-FlashBytes {
    param([byte[]]$Actual, [byte[]]$Expected)
    if ($Actual.Length -lt $Expected.Length) { return $false }
    for ($i = 0; $i -lt $Expected.Length; $i++) {
        if ($Actual[$i] -ne $Expected[$i]) { return $false }
    }
    return $true
}

try {
    $ports = @([System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object)
    if (!$ports.Count) { throw "Aucun port COM. Brancher le CrowPanel avec un câble USB de données." }
    if (!$Port) {
        Write-Host ("Ports détectés : " + ($ports -join ", "))
        $Port = Read-Host "Port du CrowPanel (voir Outils > Port dans Arduino IDE)"
    }
    $Port = $Port.Trim().ToUpperInvariant()
    if ($ports -notcontains $Port) { throw "Le port $Port est introuvable." }

    Invoke-Checked "python" @("envoyer_tout.py", $Port, "--probe")
    if ($Verifier) { return }

    $release = Join-Path $PSScriptRoot "installation-binaries"
    $app = Join-Path $release "PonyGotchi_Studio_CrowPanel.ino.bin"
    $table = Join-Path $release "PonyGotchi_Studio_CrowPanel.ino.partitions.bin"
    $ota = Join-Path $release "reference-otadata.bin"
    $checksums = @{
        $app = "B7139A41422F736951CB70418EA25E31F28BAFA9FE96C1A5E61842256AFCB201"
        $table = "148B959CBFF1C38AA8E1D5C0BA9D612C54997B945E56A63F41223EEF650653A1"
        $ota = "F94C5D786A7A8FAB06AC5D10E33BF37711A6697636DC037559EA19CC410A17F0"
    }
    foreach ($file in $checksums.Keys) {
        if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $checksums[$file]) {
            throw "Fichier d'installation altéré : $file"
        }
    }

    if (!$Esptool) {
        $localTool = Join-Path $PSScriptRoot "../../.arduino-tools/data/packages/esp32/tools/esptool_py/4.5.1/esptool.exe"
        if (Test-Path -LiteralPath $localTool) {
            $Esptool = (Resolve-Path -LiteralPath $localTool).Path
        } else {
            $tools = Join-Path $env:LOCALAPPDATA "Arduino15/packages/esp32/tools/esptool_py"
            $match = Get-ChildItem -Path "$tools/4*/esptool.exe" -File -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($match) { $Esptool = $match.FullName }
        }
    }
    if (!$Esptool) { throw "Esptool 4 introuvable. Installer le cœur Arduino ESP32 2.0.17 ou indiquer -Esptool." }

    $base = @("--chip", "esp32", "--port", $Port, "--baud", "115200", "--after", "hard_reset")
    $readback = [IO.Path]::GetTempFileName()
    try {
        Write-Host "Vérification de la disposition flash et du démarrage existants…"
        Invoke-Checked $Esptool ($base + @("read_flash", "0x8000", "0x1000", $readback))
        if (!(Test-FlashBytes ([IO.File]::ReadAllBytes($readback)) ([IO.File]::ReadAllBytes($table)))) {
            throw "Table de partitions différente. Installation arrêtée avant la copie et le flash."
        }
        Invoke-Checked $Esptool ($base + @("read_flash", "0xe000", "0x2000", $readback))
        $currentOta = [IO.File]::ReadAllBytes($readback)
        $blankOta = $currentOta.Length -eq 8192 -and ($currentOta | Where-Object { $_ -ne 255 }).Count -eq 0
        if (!$blankOta -and !(Test-FlashBytes $currentOta ([IO.File]::ReadAllBytes($ota)))) {
            throw "Sélection de démarrage différente du profil Arduino standard. Installation arrêtée."
        }
    } finally {
        Remove-Item -LiteralPath $readback -ErrorAction SilentlyContinue
    }

    Write-Host "Copie des 11 fichiers vers la microSD. Compter plusieurs minutes."
    Invoke-Checked "python" @("envoyer_tout.py", $Port)
    Write-Host "Téléversement du jeu dans la partition application…"
    Invoke-Checked $Esptool ($base + @("write_flash", "0x10000", $app))
    Write-Host "Installation terminée. Le CrowPanel redémarre sur PonyGotchi Studio."
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
