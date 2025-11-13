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
        <div class="command-card">
            <!-- Status Badge -->
            <div :class="['command-status', statusClass]">
                {{ statusText }}
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
            <div class="command-description">{{ command.description || command.command }}</div>

            <!-- PID Info -->
            <div v-if="command.isRunning && command.pid" class="command-pid">
                PID: {{ command.pid }}
            </div>

            <!-- Warning per comandi critici -->
            <div v-if="command.requiresConfirmation && !command.isRunning" class="command-warning">
                <i class="fas fa-exclamation-triangle"></i> Richiede conferma
            </div>

            <!-- Actions -->
            <div class="command-actions">
                <!-- Pulsante Esegui - visibile solo se NON in esecuzione -->
                <button 
                    v-if="!command.isRunning"
                    @click="$emit('execute', command.id, command.name, command.requiresConfirmation)"
                    class="btn btn-primary btn-execute"
                    title="Esegui comando"
                >
                    <i class="fas fa-play"></i>
                    Esegui
                </button>

                <!-- Pulsanti Focus e Stop - visibili solo se in esecuzione -->
                <template v-if="command.isRunning">
                    <button 
                        @click="$emit('focus', command.pid, command.name)"
                        class="btn btn-focus btn-split"
                        title="Porta in primo piano"
                    >
                        <i class="fas fa-eye"></i>
                        Focus
                    </button>

                    <button 
                        @click="$emit('kill', command.id, command.name)"
                        class="btn btn-danger btn-split"
                        title="Termina processo"
                    >
                        <i class="fas fa-stop"></i>
                        Stop
                    </button>
                </template>
            </div>
        </div>
    `,
    data() {
        return {
            placeholderIcon: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg'
        };
    },
    computed: {
        statusClass() {
            return this.command.isRunning ? 'status-running' : 'status-stopped';
        },
        statusText() {
            return this.command.isRunning ? 'RUNNING' : 'STOPPED';
        }
    },
    methods: {
        handleImageError(event) {
            event.target.src = this.placeholderIcon;
        }
    },
    emits: ['execute', 'focus', 'kill']
};
