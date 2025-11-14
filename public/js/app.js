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
            searchString: '',
            results: [],
            
            // Config
            apiBase: '/api',
            refreshInterval: null,
            
            // TMDb API
            tmdbApiUrl: 'https://api.themoviedb.org/3',
            imageUrl: 'https://image.tmdb.org/t/p/w500/',
            tmdbOptions: {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0NDk3OWE4YWI3YzEyYTc1MWYxZjVhZTZjMzM4ZGU0ZCIsInN1YiI6IjY1NmRiZjhkNGE0YmY2MDEwMzUxMTc0ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.NQ5B3w-U4U5Uwg3nCOX7asEO-psqD_ken-kkZrHFZSA'
                },
            },
            availableProviders: [
                { condition: "always", provide_name: "Streaming Unity", url: "https://streamingunity.co/search?q=%query%", logo_path: "https://streamingunity.co/img/logo.png" },
                { condition: "empty", provide_name: "Google", url: "https://www.google.com/search?q=dove+guardare+%query%", logo_path: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/240px-Google_%22G%22_logo.svg.png" },
                { provider_id: 337, provider_name: "Disney Plus", url: "https://www.google.com/search?q=%query%+site:disneyplus.com" },
                { provider_id: 8, provider_name: "Netflix", url: "https://www.netflix.com/search?q=%query%" },
                { provider_id: 2, provider_name: "Apple TV", url: "https://tv.apple.com/search?term=%query%" },
                { provider_id: 350, provider_name: "Apple TV Plus", url: "https://tv.apple.com/search?term=%query%" },
                { provider_id: 3, provider_name: "Google Play Movies", url: "https://play.google.com/store/search?q=%query%&c=movies&hl=it" },
                { provider_id: 39, provider_name: "Now TV", url: "https://www.google.com/search?q=%query%+site:nowtv.it" },
                { provider_id: 222, provider_name: "Rai Play", url: "https://www.raiplay.it/ricerca.html?q=%query%" },
                { provider_id: 188, provider_name: "YouTube Premium", url: "https://www.youtube.com/results?search_query=%query%" },
                { provider_id: 68, provider_name: "Microsoft Store", url: "https://www.microsoft.com/it-it/search/shop/movies?q=%query%" },
                { provider_id: 119, provider_name: "Amazon Prime Video", url: "https://www.primevideo.com/-/it/search/ref=atv_nb_sug?phrase=%query%" },
                { provider_id: 10, provider_name: "Amazon Video Fallback?", url: "https://www.primevideo.com/-/it/search/ref=atv_nb_sug?phrase=%query%" },
                { provider_id: 531, provider_name: "Paramount Plus", url: "https://www.primevideo.com/-/it/search/ref=atv_nb_sug?phrase=%query%" },
                { provider_id: 582, provider_name: "Paramount+ Amazon Channel", url: "https://www.primevideo.com/-/it/search/ref=atv_nb_sug?phrase=%query%" },
                { provider_id: 584, provider_name: "Discovery+ Amazon Channel", url: "https://www.primevideo.com/-/it/search/ref=atv_nb_sug?phrase=%query%" },
                { provider_id: 283, provider_name: "Crunchyroll", url: "https://www.crunchyroll.com/it/search?q=%query%" },
            ]
        };
    },
    computed: {
        runningCount() {
            return this.commands.filter(cmd => cmd.isRunning).length;
        },
        filteredCommands() {
            if (!this.searchString || this.searchString.trim() === '') {
                return this.commands;
            }
            
            const search = this.searchString.toLowerCase();
            return this.commands.filter(cmd => 
                cmd.name.toLowerCase().includes(search) ||
                (cmd.command && cmd.command.toLowerCase().includes(search))
            );
        }
    },
    methods: {
        // ==================== SEARCH ====================
        search() {
            this.results = [];

            if (this.searchString.length >= 3) {
                fetch(`${this.tmdbApiUrl}/search/multi?query=${encodeURIComponent(this.searchString)}&include_adult=true&language=it-IT&page=1&region=it-IT`, this.tmdbOptions)
                    .then(r => r.json())
                    .then(r => {
                        this.results = r.results.filter(item => item.media_type !== "person");
                    })
                    .then(() => {
                        this.getProviders();
                    })
                    .catch(err => {
                        console.error('Search error:', err);
                    });
            }
        },
        
        clearSearch() {
            this.results = [];
            this.searchString = '';
        },
        
        getProviders() {
            this.results.forEach(element => {
                fetch(`${this.tmdbApiUrl}/${element.media_type}/${element.id}/watch/providers`, this.tmdbOptions)
                    .then(r => r.json())
                    .then(r => {
                        let i = this.results.findIndex(x => x.id == element.id);
                        if (this.results[i]) {
                            this.results[i].providers = this.filterProviders(r.results.IT);
                        }
                    })
                    .catch(err => {
                        console.error('Providers error:', err);
                    });
            });
        },
        
        filterProviders(providers) {
            let result = {
                flatrate: []
            };

            if (providers) {
                if (providers.flatrate) {
                    let flatrate = providers.flatrate.filter(provider => {
                        return this.availableProviders.find(x => x.provider_id == provider.provider_id);
                    }).map(provider => {
                        provider.logo_path = this.imageUrl + provider.logo_path;
                        provider.url = this.availableProviders.find(x => x.provider_id == provider.provider_id).url;
                        return provider;
                    });
                    result.flatrate = flatrate;
                }
            }

            // Always
            result.flatrate.push(...this.availableProviders.filter(x => x.condition == "always"));

            // Fallback
            if (result.flatrate.length == 1) {
                result.flatrate.push(...this.availableProviders.filter(x => x.condition == "empty"));
            }

            return result;
        },
        
        parseUrl(url, name) {
            return url.replace("%query%", encodeURIComponent(name));
        },
        
        parseDate(date) {
            return new Date(date).getFullYear();
        },
        
        parseStars(stars) {
            return Math.round(stars) / 2;
        },
        
        parseDescription(desc, size) {
            size--;
            if (desc.length <= size) {
                return desc;
            }

            desc = desc.slice(0, desc.lastIndexOf("."));

            while (desc.length > size) {
                if (desc.lastIndexOf(".") > 0) {
                    desc = desc.slice(0, desc.lastIndexOf("."));
                } else {
                    desc = "Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.";
                    break;
                }
            }
            return desc + ".";
        },
        
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
                    // Gestisci caso tracciato vs non tracciato
                    if (data.tracked === false || data.pid === null) {
                        this.showAlert(`✅ ${name} avviato (non tracciato)`, 'success');
                    } else {
                        this.showAlert(`✅ ${name} avviato con successo (PID: ${data.pid})`, 'success');
                    }
                    await this.loadCommands();
                } else {
                    // Mostra errore con dettagli se disponibili
                    const errorMsg = data.details 
                        ? `${data.error}: ${data.details}` 
                        : data.error;
                    this.showAlert(`❌ ${errorMsg}`, 'error');
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
                    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                    this.showAlert(`❌ ${errorMsg}`, 'error');
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
                    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                    this.showAlert(`❌ ${errorMsg}`, 'error');
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
