<template>
  <div id="app">
    <!-- Alert Messages -->
    <TransitionGroup name="alert-slide" tag="div" class="alert-container">
      <div 
        v-for="alert in alerts" 
        :key="alert.id"
        :class="['alert', `alert-${alert.type}`]"
      >
        {{ alert.message }}
      </div>
    </TransitionGroup>

    <div id="appContainer">
      <!-- Search Bar -->
      <header class="appSearchBar">
        <input 
          type="text" 
          placeholder="Search..." 
          v-model="searchString"
          @input="search"
          :style="{ width: searchString ? '' : '100%' }"
        >
        <button v-if="searchString" class="clear" @click="clearSearch">
          <font-awesome-icon :icon="['fas', 'delete-left']" />
        </button>
      </header>

      <!-- Search Results Grid -->
      <main v-if="results.length" class="appCardGrid">
        <MovieCard
          v-for="item in results"
          :key="item.id"
          :item="item"
          :image-url="imageUrl"
        />
      </main>

      <!-- Command Grid (shown when no search results) -->
      <main v-else class="appCardGrid">
        <CommandCard
          v-for="cmd in commands"
          :key="cmd.id"
          :command="cmd"
          @execute="executeCommand"
          @focus="focusWindow"
          @kill="killCommand"
        />
      </main>
    </div>
  </div>
</template>

<script>
import CommandCard from './components/CommandCard.vue'
import MovieCard from './components/MovieCard.vue'

export default {
  name: 'App',
  components: {
    CommandCard,
    MovieCard
  },
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
      apiBase: 'http://127.0.0.1:2303/api',
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
        { condition: "always", provide_name: "Stremio", url: "stremio:///search?search=%query%", logo_path: "./icons/jack-rackham.svg",},
        { condition: "always", provide_name: "Streaming Unity", url: "https://streamingunity.co/search?q=%query%", logo_path: "./icons/streaming-unity.png" },
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
        { provider_id: 283, provider_name: "Crunchyroll", url: "https://www.crunchyroll.com/it/search?q=%query%" },
      ]
    };
  },
  computed: {
    runningCount() {
      return this.commands.filter(cmd => cmd.isRunning).length;
    }
  },
  methods: {
    // ==================== SEARCH ====================
    search() {
      if (!this.searchString || this.searchString.trim() === '') {
        this.results = [];
        return;
      }
      
      fetch(`${this.tmdbApiUrl}/search/multi?query=${encodeURIComponent(this.searchString)}&include_adult=true&language=it-IT&page=1&region=it-IT`, this.tmdbOptions)
        .then(r => r.json())
        .then(r => {
          this.results = r.results.filter(item => {
            if (item.media_type === "person") return false;
            
            const isIncomplete = 
              !item.backdrop_path && 
              !item.poster_path && 
              item.vote_average === 0 && 
              (item.release_date === "" || item.first_air_date === "");
            
            return !isIncomplete;
          });
        })
        .then(() => {
          this.getProviders();
        })
        .catch(err => {
          console.error('Search error:', err);
        });
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
          await this.checkRunningApps();
        }
      } catch (error) {
        console.error('Errore caricamento comandi:', error);
      }
    },

    async checkRunningApps() {
      try {
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
          const resultsByCommand = {};
          data.results.forEach(result => {
            if (!resultsByCommand[result.commandId]) {
              resultsByCommand[result.commandId] = [];
            }
            resultsByCommand[result.commandId].push(result);
          });
          
          for (const [cmdId, matches] of Object.entries(resultsByCommand)) {
            const match = matches[0];
            
            await this.adoptProcess(parseInt(cmdId), {
              pid: match.isUWP ? match.windowPid : match.processPid,
              windowPid: match.windowPid,
              process: match.isUWP ? match.windowProcess : match.processName,
              title: match.windowTitle,
              isUWP: match.isUWP
            });
          }
          
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
      try {
        const response = await fetch(`${this.apiBase}/commands`);

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
          if (data.tracked === false || data.pid === null) {
            this.showAlert(`✅ ${name} avviato (non tracciato)`, 'success');
          } else {
            this.showAlert(`✅ ${name} avviato con successo (PID: ${data.pid})`, 'success');
          }
          await this.loadCommands();
        } else {
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

      setTimeout(() => {
        this.alerts = this.alerts.filter(alert => alert.id !== id);
      }, 5000);
    }
  },
  mounted() {
    this.loadCommands();
    this.checkServerStatus();
    
    this.refreshInterval = setInterval(() => {
      this.loadCommands();
    }, 5000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}
</script>

<style scoped>
/* Gli stili sono già nel CSS globale */
</style>
