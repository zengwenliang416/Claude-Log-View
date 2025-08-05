<template>
  <aside class="message-index">
    <div class="index-header">
      <h2 class="index-title">Message Index</h2>
    </div>
    
    <FilterControls
      :available-roles="availableRoles"
      :available-tools="availableTools"
      :selected-roles="selectedRoles"
      :selected-tools="selectedTools"
      :search-query="searchQuery"
      :role-message-counts="roleMessageCounts"
      :tool-message-counts="toolMessageCounts"
      :is-showing-all="isShowingAll"
      :filter-mode="filterMode"
      :are-all-roles-selected="areAllRolesSelected"
      :are-all-tools-selected="areAllToolsSelected"
      @role-filter-toggle="$emit('role-filter-toggle', $event)"
      @tool-filter-toggle="$emit('tool-filter-toggle', $event)"
      @search-change="$emit('search-change', $event)"
      @clear-all-filters="$emit('clear-all-filters')"
      @select-all-roles="$emit('select-all-roles')"
      @select-all-tools="$emit('select-all-tools')"
    />
    
    <NavigationControls
      :can-go-previous="canGoPrevious"
      :can-go-next="canGoNext"
      :navigation-info="navigationInfo"
      @navigate-previous="$emit('navigate-previous')"
      @navigate-next="$emit('navigate-next')"
    />
    
    <MessageList
      :messages="messages"
      :current-index="currentIndex"
      @message-click="$emit('message-selected', $event)"
    />
  </aside>
</template>

<script>
import FilterControls from './FilterControls.vue'
import NavigationControls from './NavigationControls.vue'
import MessageList from './MessageList.vue'

export default {
  name: 'MessageIndex',
  components: {
    FilterControls,
    NavigationControls,
    MessageList
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    availableRoles: {
      type: Array,
      default: () => []
    },
    availableTools: {
      type: Array,
      default: () => []
    },
    selectedRoles: {
      type: Set,
      default: () => new Set()
    },
    selectedTools: {
      type: Set,
      default: () => new Set()
    },
    searchQuery: {
      type: String,
      default: ''
    },
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
    },
    roleMessageCounts: {
      type: Object,
      default: () => ({})
    },
    toolMessageCounts: {
      type: Object,
      default: () => ({})
    },
    isShowingAll: {
      type: Boolean,
      default: false
    },
    filterMode: {
      type: String,
      default: 'inclusive'
    },
    areAllRolesSelected: {
      type: Boolean,
      default: false
    },
    areAllToolsSelected: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'message-selected',
    'role-filter-toggle',
    'tool-filter-toggle',
    'search-change',
    'navigate-previous',
    'navigate-next',
    'clear-all-filters',
    'select-all-roles',
    'select-all-tools'
  ]
}
</script>

<style scoped>
.message-index {
  width: var(--sidebar-width);
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.index-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.index-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* Responsive design */
@media (max-width: 768px) {
  .message-index {
    width: 100%;
    position: absolute;
    z-index: var(--z-fixed);
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }
  
  .message-index.open {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .index-header {
    padding: var(--spacing-md);
  }
  
  .index-title {
    font-size: var(--font-size-base);
  }
}
</style>