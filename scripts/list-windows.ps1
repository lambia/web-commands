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
        
        # Rimuovi caratteri di controllo e problematici dal titolo
        $current = $_
        $cleanTitle = $current.MainWindowTitle
        # Rimuove caratteri ASCII di controllo (0x00-0x1F) e DEL (0x7F)
        $cleanTitle = $cleanTitle -replace '[\x00-\x1F\x7F]+', ''
        # Rimuove anche altri caratteri problematici per JSON
        $cleanTitle = $cleanTitle -replace '[\r\n\t]', ' '
        $cleanTitle = $cleanTitle.Trim()

        # Raccogli processi figli (se presenti) con pid, nome e path
        $childProcesses = @()
        try {
            $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $current.Id }
            foreach ($ch in $children) {
                $chPath = ''
                try { $chPath = $ch.ExecutablePath } catch { $chPath = '' }
                $childProcesses += [PSCustomObject]@{
                    pid = $ch.ProcessId
                    name = ($ch.Name -replace '\.exe$', '')
                    path = $chPath
                }
            }
        } catch {
            # ignore
        }

        [PSCustomObject]@{
            process = $current.ProcessName
            title = $cleanTitle
            pid = $current.Id
            path = $exePath
            children = $childProcesses
        }
    }
    
    # Output come JSON
    if ($windows) {
        $json = $windows | ConvertTo-Json -Compress -Depth 3
        # Ulteriore pulizia del JSON per sicurezza
        $json = $json -replace '[\x00-\x1F\x7F]', ''
        Write-Output $json
    } else {
        Write-Output "[]"
    }
    exit 0
} catch {
    Write-Error "Errore: $_"
    exit 1
}
