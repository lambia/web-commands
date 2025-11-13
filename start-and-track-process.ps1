# Script PowerShell per lanciare un processo e ottenere il PID finale
# Gestisce app moderne Windows (UWP) che usano ApplicationFrameHost
# Uso: .\start-and-track-process.ps1 -Command "calc.exe"

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

# $PID è una variabile automatica di PowerShell, uso $ProcessPid invece

try {
    # Estrai executable e argomenti
    $parts = $Command -split ' ', 2
    $executable = $parts[0]
    $arguments = if ($parts.Length -gt 1) { $parts[1] } else { "" }
    
    # Ottieni il nome del processo (senza .exe)
    $processName = [System.IO.Path]::GetFileNameWithoutExtension($executable)
    
    # Mapping per app UWP che usano ApplicationFrameHost
    $uwpApps = @{
        'calc' = 'Calculator'
        'calculator' = 'Calculator'
        'mspaint' = 'Paint'
        'paint' = 'Paint'
    }
    
    # Salva finestre esistenti PRIMA del lancio
    $existingWindows = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, MainWindowTitle
    
    # Avvia processo
    if ($arguments) {
        $process = Start-Process -FilePath $executable -ArgumentList $arguments -PassThru -WindowStyle Normal
    } else {
        $process = Start-Process -FilePath $executable -PassThru -WindowStyle Normal
    }
    
    $initialProcessPid = $process.Id
    
    # Aspetta che l'app si stabilizzi (UWP apps possono impiegare tempo)
    Start-Sleep -Milliseconds 1500
    
    # Cerca NUOVE finestre apparse
    $allWindows = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object Id, MainWindowTitle, ProcessName
    $newWindows = $allWindows | Where-Object { 
        $currentPid = $_.Id
        -not ($existingWindows | Where-Object { $_.Id -eq $currentPid })
    }
    
    # Per app UWP, cerca il titolo specifico
    $expectedTitle = $uwpApps[$processName.ToLower()]
    if ($expectedTitle) {
        # Prima cerca tra le NUOVE finestre
        $uwpWindow = $newWindows | Where-Object { $_.MainWindowTitle -like "*$expectedTitle*" }
        
        # Se non trovato tra le nuove, cerca tra TUTTE le finestre (app già aperta)
        if (-not $uwpWindow) {
            $uwpWindow = $allWindows | Where-Object { $_.MainWindowTitle -like "*$expectedTitle*" } | Select-Object -First 1
        }
        
        if ($uwpWindow) {
            $finalProcessPid = $uwpWindow.Id
            $finalProcessName = $uwpWindow.ProcessName
            Write-Output "{`"success`":true,`"pid`":$finalProcessPid,`"initialPid`":$initialProcessPid,`"processName`":`"$finalProcessName`",`"windowTitle`":`"$($uwpWindow.MainWindowTitle)`"}"
            exit 0
        }
    }
    
    # Fallback: cerca per nome processo
    $sameNameProcess = $newWindows | Where-Object { $_.ProcessName -eq $processName }
    if ($sameNameProcess) {
        $finalProcessPid = $sameNameProcess.Id
        Write-Output "{`"success`":true,`"pid`":$finalProcessPid,`"initialPid`":$initialProcessPid,`"processName`":`"$($sameNameProcess.ProcessName)`",`"windowTitle`":`"$($sameNameProcess.MainWindowTitle)`"}"
        exit 0
    }
    
    # Verifica che il processo iniziale esista ancora
    $stillExists = Get-Process -Id $initialProcessPid -ErrorAction SilentlyContinue
    if ($stillExists -and $stillExists.MainWindowHandle -ne 0) {
        Write-Output "{`"success`":true,`"pid`":$initialProcessPid,`"initialPid`":$initialProcessPid,`"processName`":`"$processName`"}"
        exit 0
    }
    
    # Se arriviamo qui, qualcosa è andato storto ma non bloccare
    Write-Output "{`"success`":true,`"pid`":$initialProcessPid,`"initialPid`":$initialProcessPid,`"processName`":`"$processName`",`"warning`":`"Processo potrebbe essere terminato`"}"
    exit 0
    
} catch {
    Write-Error "{`"success`":false,`"error`":`"$($_.Exception.Message)`"}"
    exit 1
}
