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
            <div class="hover-wrapper">
            

            <!-- Card Content -->
            <component 
                :is="iconComponent"
                v-if="command.icon"
                :src="command.icon.src"
                :alt="iconComponent === 'img' ? (command.text?.name || command.name) : undefined"
                :aria-label="iconComponent === 'i' ? (command.text?.name || command.name) : undefined"
                :class="command.icon.class"
                :style="command.icon.style"
                @error="handleImageError"
            />
            <label 
                v-if="command.text?.visible !== false"
                :class="command.text?.class" 
                :style="command.text?.style"
            >
                {{ command.text?.name || command.name }}
            </label>
            </div>
        </a>
    `,
    computed: {
        iconComponent() {
            // Determina il componente da usare: 'img' o 'i'
            return this.command.icon?.type || 'i';
        },
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
            // Se action.type non è specificato o è 'link', usa action.value come href
            if (!this.command.action?.value) {
                return null; // Value vuoto = non fare nulla
            }
            const actionType = this.command.action?.type || 'link'; // Default a 'link'
            return actionType === 'link' ? this.command.action.value : null;
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

            // Previeni comportamento di default per comandi
            event.preventDefault();

            // Se action.value è vuoto, non fare nulla
            if (!this.command.action?.value) {
                return;
            }

            if (this.command.isRunning) {
                // Se running, fa focus
                this.$emit('focus', this.command.pid, this.command.name);
            } else {
                // Se stopped, esegue
                this.$emit('execute', this.command.id, this.command.name, this.command.action?.requiresConfirmation || false);
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
