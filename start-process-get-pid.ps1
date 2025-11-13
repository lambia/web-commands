# Script PowerShell per lanciare un comando e ottenere il PID reale
# Uso: .\start-process-get-pid.ps1 -Command "notepad.exe"

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

try {
    # Estrai executable e argomenti
    $parts = $Command -split ' ', 2
    $executable = $parts[0]
    $arguments = if ($parts.Length -gt 1) { $parts[1] } else { "" }
    
    # Avvia processo
    if ($arguments) {
        $process = Start-Process -FilePath $executable -ArgumentList $arguments -PassThru -WindowStyle Normal
    } else {
        $process = Start-Process -FilePath $executable -PassThru -WindowStyle Normal
    }
    
    # Aspetta che il processo si avvii
    Start-Sleep -Milliseconds 100
    
    # Verifica che il processo esista
    if ($process -and $process.Id) {
        # Output JSON con PID
        Write-Output "{`"success`":true,`"pid`":$($process.Id)}"
        exit 0
    } else {
        Write-Error "{`"success`":false,`"error`":`"Processo non avviato`"}"
        exit 1
    }
} catch {
    Write-Error "{`"success`":false,`"error`":`"$($_.Exception.Message)`"}"
    exit 1
}
