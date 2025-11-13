// Componente CommandCard per Vue 3
const CommandCard = {
    name: 'CommandCard',
    props: {
        command: {
            type: Object,
            required: true
        }
    },
    template: `
        <div class="command-card" @click="handleCardClick">
            <!-- Status Badge - solo se running -->
            <div v-if="command.isRunning" class="command-status status-running" @click.stop="handleStop" title="Termina processo">
                RUNNING
                <i class="fas fa-stop stop-icon"></i>
            </div>

            <!-- Icon -->
            <img 
                :src="command.icon || placeholderIcon" 
                :alt="command.name"
                class="command-icon"
                @error="handleImageError"
            >

            <!-- Info -->
            <div class="command-name">{{ command.name }}</div>
        </div>
    `,
    data() {
        return {
            placeholderIcon: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg'
        };
    },
    methods: {
        handleImageError(event) {
            event.target.src = this.placeholderIcon;
        },
        handleCardClick() {
            if (this.command.isRunning) {
                // Se running, fa focus
                this.$emit('focus', this.command.pid, this.command.name);
            } else {
                // Se stopped, esegue
                this.$emit('execute', this.command.id, this.command.name, this.command.requiresConfirmation);
            }
        },
        handleStop() {
            // Gestisce lo stop senza propagare il click alla card
            this.$emit('kill', this.command.id, this.command.name);
        }
    },
    emits: ['execute', 'focus', 'kill']
};
