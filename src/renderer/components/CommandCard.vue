<template>
  <a 
    class="appCard" 
    :style="cardStyle" 
    :class="cardClass"
    :href="cardHref"
    @click="handleCardClick"
    tabindex="0"
    @keydown.enter="handleCardClick"
  >
    <!-- Status Badge - solo se running -->
    <div 
      v-if="command.isRunning" 
      class="command-status" 
      @click.stop="handleStop" 
      title="Click to terminate"
    >
      RUNNING
      <font-awesome-icon :icon="['fas', 'stop']" class="stop-icon" />
    </div>
    
    <div class="hover-wrapper">
      <!-- Icon Component -->
      <!-- Image icon -->
      <img 
        v-if="command.icon?.src"
        :src="command.icon.src"
        :alt="command.text?.name || command.name"
        :class="command.icon.class"
        :style="command.icon.style"
        @error="handleImageError"
      />
      
      <!-- FontAwesome icon -->
      <font-awesome-icon 
        v-else-if="command.icon?.class"
        :icon="parseIcon(command.icon.class)"
        :class="command.icon.class"
        :style="command.icon.style"
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
</template>

<script>
export default {
  name: 'CommandCard',
  props: {
    command: {
      type: Object,
      required: true
    }
  },
  emits: ['execute', 'focus', 'kill'],
  computed: {
    cardStyle() {
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
      return this.command.tile?.class || '';
    },
    cardHref() {
      if (!this.command.action?.value) {
        return null;
      }
      const actionType = this.command.action?.type || 'link';
      return actionType === 'link' ? this.command.action.value : null;
    }
  },
  methods: {
    parseIcon(iconClass) {
      // Converte classe FontAwesome in formato array per Vue FontAwesome
      // es: "fa-solid fa-moon" -> ['fas', 'moon']
      // es: "fas fa-power-off" -> ['fas', 'power-off']
      if (!iconClass) return ['fas', 'gear'];
      
      const parts = iconClass.split(' ');
      
      // Trova il prefisso (fa-solid, fa-regular, fa-brands o fas, far, fab)
      let prefix = 'fas';
      if (parts.includes('fa-solid') || parts.includes('fas')) prefix = 'fas';
      else if (parts.includes('fa-regular') || parts.includes('far')) prefix = 'far';
      else if (parts.includes('fa-brands') || parts.includes('fab')) prefix = 'fab';
      
      // Trova il nome dell'icona (qualsiasi parte che inizia con fa- ma non è fa-solid/regular/brands)
      const iconName = parts.find(p => 
        p.startsWith('fa-') && 
        !['fa-solid', 'fa-regular', 'fa-brands'].includes(p)
      )?.replace('fa-', '') || 'gear';
      
      return [prefix, iconName];
    },
    handleImageError(event) {
      console.error('Errore caricamento immagine:', event.target.src);
      event.target.style.display = 'none';
      const iconClass = this.command.icon?.class || this.getDefaultIconClass();
      const icon = this.parseIcon(iconClass);
      const textClass = this.command.text?.class || 'text-4';
      const name = this.command.text?.name || this.command.name;
      
      // Fallback a icona FontAwesome
      event.target.parentElement.innerHTML = `
        <font-awesome-icon :icon="${JSON.stringify(icon)}" class="${iconClass}" />
        <label class="${textClass}">${name}</label>
      `;
    },
    getDefaultIconClass() {
      const name = this.command.name?.toLowerCase() || '';
      if (name.includes('shutdown') || name.includes('power')) return 'fas fa-power-off text-7';
      if (name.includes('sleep')) return 'fas fa-moon text-7';
      if (name.includes('hibernate')) return 'fas fa-bed text-7';
      if (name.includes('notepad') || name.includes('note')) return 'fas fa-file-lines text-7';
      if (name.includes('calc')) return 'fas fa-calculator text-7';
      if (name.includes('paint')) return 'fas fa-palette text-7';
      if (name.includes('browser') || name.includes('chrome') || name.includes('firefox')) return 'fas fa-globe text-7';
      if (name.includes('folder') || name.includes('explorer')) return 'fas fa-folder text-7';
      if (name.includes('terminal') || name.includes('cmd')) return 'fas fa-terminal text-7';
      return 'fas fa-gear text-7';
    },
    handleCardClick(event) {
      if (this.cardHref) {
        return;
      }

      event.preventDefault();

      if (!this.command.action?.value) {
        return;
      }

      if (this.command.isRunning) {
        this.$emit('focus', this.command.pid, this.command.name);
      } else {
        this.$emit('execute', this.command.id, this.command.name, this.command.action?.requiresConfirmation || false);
      }
    },
    handleStop(event) {
      event.stopPropagation();
      event.preventDefault();
      this.$emit('kill', this.command.id, this.command.name);
    }
  }
}
</script>

<style scoped>
/* Gli stili sono già nel CSS globale */
</style>
