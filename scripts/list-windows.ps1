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
        
        [PSCustomObject]@{
            process = $_.ProcessName
            title = $_.MainWindowTitle
            pid = $_.Id
            path = $exePath
        }
    }
    
    # Output come JSON
    $windows | ConvertTo-Json -Compress
    exit 0
} catch {
    Write-Error "Errore: $_"
    exit 1
}
