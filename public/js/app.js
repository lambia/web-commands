// Web Commands - Vue 3 App
const { createApp } = Vue;

const app = createApp({
    data() {
        return {
            // Auth
            authenticated: false,
            apiKey: '',
            apiKeyInput: 'your-secret-api-key-here',
            
            // State
            commands: [],
            serverOnline: false,
            alerts: [],
            alertIdCounter: 0,
            
            // Config
            apiBase: '/api',
            refreshInterval: null
        };
    },
    computed: {
        runningCount() {
            return this.commands.filter(cmd => cmd.isRunning).length;
        }
    },
    methods: {
        // ==================== AUTH ====================
        async authenticate() {
            this.apiKey = this.apiKeyInput.trim();
            
            if (!this.apiKey) {
                this.showAlert('Inserisci una API Key valida', 'error');
                return;
            }

            try {
                const response = await fetch(`${this.apiBase}/health`);
                const data = await response.json();

                if (data.success) {
                    this.authenticated = true;
                    this.showAlert('Autenticazione riuscita!', 'success');
                    await this.loadCommands();
                    this.checkServerStatus();
                    
                    // Auto-refresh ogni 5 secondi
                    this.refreshInterval = setInterval(() => {
                        this.loadCommands();
                    }, 5000);
                }
            } catch (error) {
                this.showAlert('Errore di connessione al server', 'error');
            }
        },

        // ==================== API CALLS ====================
        async loadCommands() {
            try {
                const response = await fetch(`${this.apiBase}/commands`, {
                    headers: { 'X-API-Key': this.apiKey }
                });

                if (!response.ok) {
                    throw new Error('Errore caricamento comandi');
                }

                const data = await response.json();
                
                if (data.success) {
                    this.commands = data.commands;
                    // Dopo aver caricato i comandi, verifica quali sono già running
                    await this.checkRunningApps();
                }
            } catch (error) {
                console.error('Errore caricamento comandi:', error);
            }
        },

        async checkRunningApps() {
            try {
                const response = await fetch(`${this.apiBase}/windows`, {
                    headers: { 'X-API-Key': this.apiKey }
                });

                if (!response.ok) return;

                const data = await response.json();
                
                if (data.success && Array.isArray(data.windows)) {
                    // Per ogni comando, verifica se è già running
                    for (const cmd of this.commands) {
                        // Salta se già tracciato dal server
                        if (cmd.isRunning) continue;
                        
                        // Estrae il nome eseguibile dal comando (rimuove path e argomenti)
                        const cmdParts = cmd.command.split(/\s+/)[0]; // Rimuove argomenti
                        const cmdExecutable = cmdParts.split(/[/\\]/).pop(); // Prende solo il nome file (rimuove path)
                        const cmdExecutableNoExt = cmdExecutable.toLowerCase().replace(/\.exe$/, ''); // Rimuove .exe
                        
                        // Cerca tra le finestre aperte
                        const runningWindow = data.windows.find(win => {
                            const processName = win.process.toLowerCase();
                            const processPath = (win.path || '').toLowerCase();
                            
                            // Estrae nome eseguibile dal path della finestra
                            let windowExecutable = '';
                            if (processPath) {
                                windowExecutable = processPath.split(/[/\\]/).pop().replace(/\.exe$/, '');
                            }
                            
                            // 1. Match esatto per nome eseguibile dal path
                            if (cmdExecutableNoExt && windowExecutable && cmdExecutableNoExt === windowExecutable) {
                                console.log(`✅ Match esatto path: ${cmdExecutable} = ${windowExecutable}`);
                                return true;
                            }
                            
                            // 2. Match process name esatto
                            if (cmdExecutableNoExt === processName) {
                                console.log(`✅ Match esatto process: ${cmdExecutable} = ${processName}`);
                                return true;
                            }
                            
                            // 3. Match parziale: cerca se command è incluso nel process name
                            if (processName.includes(cmdExecutableNoExt)) {
                                console.log(`✅ Match command in process: "${cmdExecutableNoExt}" found in "${processName}"`);
                                return true;
                            }
                            
                            // 4. Match parziale inverso: cerca se process name è incluso nel command
                            if (cmdParts.toLowerCase().includes(processName)) {
                                console.log(`✅ Match process in command: "${processName}" found in "${cmdParts}"`);
                                return true;
                            }
                            
                            // 5. Match per UWP apps: verifica processi correlati (es: ApplicationFrameHost -> CalculatorApp)
                            if (processName === 'applicationframehost' && Array.isArray(win.relatedProcesses)) {
                                for (const relatedProc of win.relatedProcesses) {
                                    const relatedName = relatedProc.name.toLowerCase();
                                    const relatedPath = (relatedProc.path || '').toLowerCase();
                                    
                                    // Estrae eseguibile dal path del processo correlato
                                    let relatedExecutable = relatedName.replace(/\.exe$/, '');
                                    if (relatedPath) {
                                        relatedExecutable = relatedPath.split(/[/\\]/).pop().replace(/\.exe$/, '');
                                    }
                                    
                                    // Match esatto o parziale con processo correlato
                                    if (relatedName.includes(cmdExecutableNoExt) || relatedExecutable.includes(cmdExecutableNoExt)) {
                                        console.log(`✅ Match UWP related process: "${cmdExecutableNoExt}" found in "${relatedName}"`);
                                        return true;
                                    }
                                }
                            }
                            
                            return false;
                        });
                        
                        // Se trovato, adotta il processo
                        if (runningWindow) {
                            await this.adoptProcess(cmd.id, runningWindow);
                        }
                    }
                    
                    // Ricarica comandi dopo adozione
                    await this.loadCommandsOnly();
                }
            } catch (error) {
                console.error('Errore check running apps:', error);
            }
        },

        async adoptProcess(cmdId, window) {
            try {
                const response = await fetch(`${this.apiBase}/commands/${cmdId}/adopt`, {
                    method: 'POST',
                    headers: {
                        'X-API-Key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pid: window.pid,
                        processName: window.process,
                        windowTitle: window.title
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    console.log(`✅ Processo adottato: ${window.process} (PID: ${window.pid})`);
                } else {
                    console.warn(`⚠️ Impossibile adottare processo ${window.process}: ${data.error}`);
                }
            } catch (error) {
                console.error('Errore adozione processo:', error);
            }
        },

        async loadCommandsOnly() {
            // Carica comandi senza ri-chiamare checkRunningApps (per evitare loop)
            try {
                const response = await fetch(`${this.apiBase}/commands`, {
                    headers: { 'X-API-Key': this.apiKey }
                });

                if (!response.ok) return;

                const data = await response.json();
                
                if (data.success) {
                    this.commands = data.commands;
                }
            } catch (error) {
                console.error('Errore caricamento comandi:', error);
            }
        },

        async checkServerStatus() {
            try {
                const response = await fetch(`${this.apiBase}/health`);
                const data = await response.json();
                this.serverOnline = data.success;
            } catch (error) {
                this.serverOnline = false;
            }
        },

        async executeCommand(id, name, requiresConfirmation) {
            if (requiresConfirmation) {
                if (!confirm(`Sei sicuro di voler eseguire "${name}"?`)) {
                    return;
                }
            }

            try {
                const response = await fetch(`${this.apiBase}/commands/${id}`, {
                    method: 'POST',
                    headers: { 'X-API-Key': this.apiKey }
                });

                const data = await response.json();

                if (data.success) {
                    this.showAlert(`✅ ${name} avviato con successo (PID: ${data.pid})`, 'success');
                    await this.loadCommands();
                } else {
                    this.showAlert(`❌ ${data.error}`, 'error');
                }
            } catch (error) {
                this.showAlert(`❌ Errore esecuzione: ${error.message}`, 'error');
            }
        },

        async focusWindow(pid, name) {
            if (!pid) {
                this.showAlert('⚠️ Processo non disponibile', 'warning');
                return;
            }

            try {
                const response = await fetch(`${this.apiBase}/focus/${pid}`, {
                    method: 'POST',
                    headers: { 'X-API-Key': this.apiKey }
                });

                const data = await response.json();

                if (data.success) {
                    this.showAlert(`✅ ${name} portato in primo piano`, 'success');
                } else {
                    this.showAlert(`❌ ${data.error}`, 'error');
                }
            } catch (error) {
                this.showAlert(`❌ Errore focus: ${error.message}`, 'error');
            }
        },

        async killCommand(id, name) {
            if (!confirm(`Vuoi terminare "${name}"?`)) {
                return;
            }

            try {
                const response = await fetch(`${this.apiBase}/commands/${id}/kill`, {
                    method: 'POST',
                    headers: { 'X-API-Key': this.apiKey }
                });

                const data = await response.json();

                if (data.success) {
                    this.showAlert(`✅ ${name} terminato con successo`, 'success');
                    await this.loadCommands();
                } else {
                    this.showAlert(`❌ ${data.error}`, 'error');
                }
            } catch (error) {
                this.showAlert(`❌ Errore terminazione: ${error.message}`, 'error');
            }
        },

        // ==================== UI HELPERS ====================
        showAlert(message, type = 'success') {
            const id = ++this.alertIdCounter;
            this.alerts.push({ id, message, type });

            // Auto-remove dopo 5 secondi
            setTimeout(() => {
                this.alerts = this.alerts.filter(alert => alert.id !== id);
            }, 5000);
        }
    },
    mounted() {
        // Auto-login se c'è la chiave preimpostata
        if (this.apiKeyInput && this.apiKeyInput !== 'your-secret-api-key-here') {
            this.authenticate();
        }
    },
    beforeUnmount() {
        // Cleanup interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
});

// Registra componente
app.component('command-card', CommandCard);

// Mount app
app.mount('#app');
