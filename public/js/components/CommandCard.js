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
                ⚠️ Richiede conferma
            </div>

            <!-- Actions -->
            <div class="command-actions">
                <button 
                    @click="$emit('execute', command.id, command.name, command.requiresConfirmation)"
                    :disabled="command.isRunning"
                    class="btn btn-primary"
                    :title="command.isRunning ? 'Già in esecuzione' : 'Esegui comando'"
                >
                    <span class="btn-icon">▶</span>
                    Esegui
                </button>

                <button 
                    @click="$emit('focus', command.pid, command.name)"
                    :disabled="!command.isRunning"
                    class="btn btn-focus"
                    title="Porta in primo piano"
                >
                    <span class="btn-icon">🔍</span>
                    Focus
                </button>

                <button 
                    @click="$emit('kill', command.id, command.name)"
                    :disabled="!command.isRunning"
                    class="btn btn-danger"
                    title="Termina processo"
                >
                    <span class="btn-icon">⏹</span>
                    Stop
                </button>
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
