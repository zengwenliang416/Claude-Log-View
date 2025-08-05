<template>
  <div class="navigation-controls">
    <div class="nav-info">
      <span class="nav-position">{{ navigationInfo.position }}</span>
    </div>
    
    <div class="nav-buttons">
      <button
        class="nav-button"
        :class="{ disabled: !canGoPrevious }"
        :disabled="!canGoPrevious"
        @click="$emit('navigate-previous')"
        title="Previous message (Left Arrow)"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      
      <button
        class="nav-button"
        :class="{ disabled: !canGoNext }"
        :disabled="!canGoNext"
        @click="$emit('navigate-next')"
        title="Next message (Right Arrow)"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NavigationControls',
  props: {
    canGoPrevious: {
      type: Boolean,
      default: false
    },
    canGoNext: {
      type: Boolean,
      default: false
    },
    navigationInfo: {
      type: Object,
      default: () => ({ current: 0, total: 0, position: '0 / 0' })
    }
  },
  emits: [
    'navigate-previous',
    'navigate-next'
  ]
}
</script>

<style scoped>
.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.nav-info {
  flex: 1;
}

.nav-position {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.nav-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.nav-button:hover:not(.disabled) {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--accent-color);
}

.nav-button:focus {
  outline: none;
  border-color: var(--accent-color);
}

.nav-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--text-muted);
}

.nav-icon {
  width: 16px;
  height: 16px;
}

/* Responsive design */
@media (max-width: 480px) {
  .navigation-controls {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .nav-position {
    font-size: var(--font-size-xs);
  }
  
  .nav-button {
    width: 28px;
    height: 28px;
  }
  
  .nav-icon {
    width: 14px;
    height: 14px;
  }
}
</style>