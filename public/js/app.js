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
