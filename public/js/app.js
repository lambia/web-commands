// Web Commands - Vue 3 App
const { createApp } = Vue;

const app = createApp({
    data() {
        return {
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
        // ==================== API CALLS ====================
        async loadCommands() {
            try {
                const response = await fetch(`${this.apiBase}/commands`);

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
                // Prepara lista comandi da controllare (solo quelli non già running)
                const commandsToCheck = this.commands
                    .filter(cmd => !cmd.isRunning)
                    .map(cmd => ({ id: cmd.id, command: cmd.command }));
                
                if (commandsToCheck.length === 0) return;
                
                const response = await fetch(`${this.apiBase}/check-commands`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ commands: commandsToCheck })
                });

                if (!response.ok) return;

                const data = await response.json();
                
                if (data.success && Array.isArray(data.results)) {
                    // Raggruppa risultati per commandId
                    const resultsByCommand = {};
                    data.results.forEach(result => {
                        if (!resultsByCommand[result.commandId]) {
                            resultsByCommand[result.commandId] = [];
                        }
                        resultsByCommand[result.commandId].push(result);
                    });
                    
                    // Adotta processi trovati
                    for (const [cmdId, matches] of Object.entries(resultsByCommand)) {
                        // Prendi il primo match (o gestisci multi-istanza in futuro)
                        const match = matches[0];
                        
                        await this.adoptProcess(parseInt(cmdId), {
                            pid: match.isUWP ? match.windowPid : match.processPid,
                            windowPid: match.windowPid,
                            process: match.isUWP ? match.windowProcess : match.processName,
                            title: match.windowTitle,
                            isUWP: match.isUWP
                        });
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
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pid: window.pid,
                        processName: window.process,
                        windowTitle: window.title
                    })
                });

                const data = await response.json();
                
                if (!data.success) {
                    console.warn(`Impossibile adottare processo: ${data.error}`);
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
                    method: 'POST'
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
                    method: 'POST'
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
                    method: 'POST'
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
        },

        async checkServerStatus() {
            try {
                const response = await fetch(`${this.apiBase}/health`);
                const data = await response.json();
                this.serverOnline = data.success || false;
            } catch {
                this.serverOnline = false;
            }
        }
    },
    mounted() {
        // Auto-start app
        this.loadCommands();
        this.checkServerStatus();
        
        // Auto-refresh ogni 5 secondi
        this.refreshInterval = setInterval(() => {
            this.loadCommands();
        }, 5000);
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
