# Script PowerShell per ottenere la lista delle finestre aperte
# Output: JSON array con titolo e PID di ogni finestra

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;
  public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  }
"@

try {
    $windows = Get-Process | Where-Object { 
        $_.MainWindowHandle -ne 0 -and 
        $_.MainWindowTitle -ne "" 
    } | ForEach-Object {
        $currentProcess = $_
        
        # Ottieni path eseguibile (può fallire per processi system)
        $exePath = ""
        try {
            $exePath = $currentProcess.Path
        } catch {
            $exePath = ""
        }
        
        # Escape caratteri speciali nel titolo (rimuove caratteri di controllo)
        $cleanTitle = $currentProcess.MainWindowTitle -replace '[\x00-\x1F\x7F]', ''
        
        # Se è ApplicationFrameHost, cerca processi UWP correlati per window title
        $relatedProcesses = @()
        if ($currentProcess.ProcessName -eq "ApplicationFrameHost") {
            try {
                # Cerca processi il cui nome è simile al window title
                # Es: window title "Calculator" -> cerca processi con nome "Calculator*"
                $titleWords = $cleanTitle -split '\s+' | Where-Object { $_.Length -gt 3 }
                
                foreach ($word in $titleWords) {
                    $matchingProcs = Get-Process | Where-Object { 
                        $_.ProcessName -like "*$word*" -and 
                        $_.Id -ne $currentProcess.Id
                    }
                    
                    foreach ($proc in $matchingProcs) {
                        $procPath = ""
                        try { $procPath = $proc.Path } catch { }
                        
                        $relatedProcesses += [PSCustomObject]@{
                            name = $proc.ProcessName
                            path = $procPath
                        }
                    }
                }
            } catch {
                # Ignora errori
            }
        }
        
        [PSCustomObject]@{
            process = $currentProcess.ProcessName
            title = $cleanTitle
            pid = $currentProcess.Id
            path = $exePath
            relatedProcesses = $relatedProcesses
        }
    }
    
    # Output come JSON (usa -Depth per evitare troncamenti)
    if ($windows) {
        $windows | ConvertTo-Json -Compress -Depth 5
    } else {
        "[]"
    }
    exit 0
} catch {
    Write-Error "Errore: $_"
    exit 1
}
