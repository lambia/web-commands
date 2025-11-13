# Script PowerShell per lanciare comando e restituire PID reale del processo
# Uso: .\launch-command.ps1 -Command "notepad.exe"

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

try {
    # Avvia processo
    $process = Start-Process -FilePath $Command -PassThru -WindowStyle Normal
    
    if ($process) {
        # Aspetta un attimo che il processo si stabilizzi
        Start-Sleep -Milliseconds 200
        
        # Output PID come JSON
        $result = @{
            success = $true
            pid = $process.Id
            name = $process.ProcessName
        }
        
        $result | ConvertTo-Json -Compress
        exit 0
    } else {
        throw "Impossibile avviare processo"
    }
} catch {
    $error = @{
        success = $false
        error = $_.Exception.Message
    }
    
    $error | ConvertTo-Json -Compress
    exit 1
}
