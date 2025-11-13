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
        # Ottieni path eseguibile (può fallire per processi system)
        $exePath = ""
        try {
            $exePath = $_.Path
        } catch {
            $exePath = ""
        }
        
        $current = $_

        # Raccogli processi correlati (per UWP apps come Calculator)
        $relatedProcesses = @()
        if ($current.ProcessName -eq "ApplicationFrameHost") {
            try {
                # Cerca processi il cui nome contiene parte del window title
                # Es: "Calculator" -> cerca "*Calc*"
                $titleWords = $current.MainWindowTitle -split '\s+' | Where-Object { $_.Length -gt 3 }
                
                foreach ($word in $titleWords) {
                    $matchingProcs = Get-Process | Where-Object { 
                        $_.ProcessName -like "*$word*" -and 
                        $_.Id -ne $current.Id
                    } | Select-Object -First 5  # Limita per performance
                    
                    foreach ($proc in $matchingProcs) {
                        $procPath = ""
                        try { $procPath = $proc.Path } catch { }
                        
                        $relatedProcesses += [PSCustomObject]@{
                            pid = $proc.Id
                            name = $proc.ProcessName
                            path = $procPath
                        }
                    }
                }
            } catch {
                # ignore
            }
        }

        [PSCustomObject]@{
            process = $current.ProcessName
            pid = $current.Id
            path = $exePath
            children = $relatedProcesses
        }
    }
    
    # Output come JSON
    if ($windows) {
        $windows | ConvertTo-Json -Compress -Depth 3
    } else {
        Write-Output "[]"
    }
    exit 0
} catch {
    Write-Error "Errore: $_"
    exit 1
}
