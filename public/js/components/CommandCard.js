// Componente CommandCard per Vue 3 - Launcher Style
const CommandCard = {
    name: 'CommandCard',
    props: {
        command: {
            type: Object,
            required: true
        }
    },
    template: `
        <a class="appCard" 
           :style="cardStyle" 
           :class="cardClass"
           :href="cardHref"
           :target="cardHref ? '_blank' : undefined"
           @click="handleCardClick"
           tabindex="0"
           @keydown.enter="handleCardClick">
            
            <!-- Status Badge - solo se running -->
            <div v-if="command.isRunning" 
                 class="command-status" 
                 @click.stop="handleStop" 
                 title="Click to terminate">
                RUNNING
                <i class="fas fa-stop stop-icon"></i>
            </div>

            <!-- Card Content con immagine -->
            <img v-if="command.img"
                :src="command.img.src" 
                :alt="command.name"
                :class="command.img.class"
                @error="handleImageError"
            >
            <!-- Card Content con icona e testo -->
            <span v-else>
                <i v-if="command.icon" :class="command.icon.class"></i>
                <label :class="command.text?.class">{{ command.text?.name || command.name }}</label>
            </span>
        </a>
    `,
    computed: {
        cardStyle() {
            // Usa gli stili da tile.style se presenti
            if (this.command.tile && this.command.tile.style) {
                return this.command.tile.style;
            }
            
            // Fallback: genera colori dinamici basati sull'ID del comando
            const colors = [
                '#667eea', '#764ba2', '#f093fb', '#4facfe',
                '#43e97b', '#fa709a', '#fee140', '#30cfd0'
            ];
            const bgColor = colors[this.command.id % colors.length];
            
            return {
                backgroundColor: bgColor,
                color: '#FFFFFF'
            };
        },
        cardClass() {
            // Usa le classi da tile.class se presenti
            return this.command.tile?.class || '';
        },
        cardHref() {
            // Usa href da tile.href se presente (per link esterni)
            return this.command.tile?.href || null;
        }
    },
    methods: {
        handleImageError(event) {
            console.error('Errore caricamento immagine:', event.target.src);
            // Mostra icona fallback
            event.target.style.display = 'none';
            const iconClass = this.command.icon?.class || this.getDefaultIconClass();
            const textClass = this.command.text?.class || 'text-4';
            const name = this.command.text?.name || this.command.name;
            event.target.parentElement.innerHTML = `<i class="${iconClass}"></i><label class="${textClass}">${name}</label>`;
        },
        getDefaultIconClass() {
            // Icone di default basate sul nome
            const name = this.command.name.toLowerCase();
            if (name.includes('shutdown') || name.includes('power')) return 'fas fa-power-off text-7';
            if (name.includes('sleep')) return 'fas fa-moon text-7';
            if (name.includes('hibernate')) return 'fas fa-bed text-7';
            if (name.includes('notepad') || name.includes('note')) return 'fas fa-file-alt text-7';
            if (name.includes('calc')) return 'fas fa-calculator text-7';
            if (name.includes('paint')) return 'fas fa-palette text-7';
            if (name.includes('browser') || name.includes('chrome') || name.includes('firefox')) return 'fas fa-globe text-7';
            if (name.includes('folder') || name.includes('explorer')) return 'fas fa-folder text-7';
            if (name.includes('terminal') || name.includes('cmd')) return 'fas fa-terminal text-7';
            return 'fas fa-cog text-7';
        },
        handleCardClick(event) {
            // Se ha un href (link esterno), lascia che il browser gestisca il click
            if (this.cardHref) {
                return; // Il link si aprirà normalmente
            }
            
            // Altrimenti gestisci come comando
            event.preventDefault();
            
            if (this.command.isRunning) {
                // Se running, fa focus
                this.$emit('focus', this.command.pid, this.command.name);
            } else {
                // Se stopped, esegue
                this.$emit('execute', this.command.id, this.command.name, this.command.requiresConfirmation);
            }
        },
        handleStop(event) {
            // Gestisce lo stop senza propagare il click alla card
            event.stopPropagation();
            event.preventDefault();
            this.$emit('kill', this.command.id, this.command.name);
        }
    },
    emits: ['execute', 'focus', 'kill']
};
