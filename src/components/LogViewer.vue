<template>
  <div class="log-viewer" @keydown="handleKeyboard">
    <header class="app-header">
      <h1 class="app-title">Claude Log Viewer</h1>
      <FileUpload @file-loaded="handleFileLoad" :loading="isLoading" />
    </header>
    
    <main class="app-main">
      <MessageIndex
        :messages="filteredMessages"
        :current-index="currentIndex"
        :total-messages="totalMessages"
        :available-roles="availableRoles"
        :available-tools="availableTools"
        :selected-roles="selectedRoles"
        :selected-tools="selectedTools"
        :search-query="searchQuery"
        :can-go-previous="canGoPrevious"
        :can-go-next="canGoNext"
        :navigation-info="navigationInfo"
        :role-message-counts="roleMessageCounts"
        :tool-message-counts="toolMessageCounts"
        :is-showing-all="isShowingAll"
        :filter-mode="filterMode"
        :are-all-roles-selected="areAllRolesSelected"
        :are-all-tools-selected="areAllToolsSelected"
        @message-selected="goToIndex"
        @role-filter-toggle="toggleRoleFilter"
        @tool-filter-toggle="toggleToolFilter"
        @search-change="searchQuery = $event"
        @navigate-previous="goToPrevious"
        @navigate-next="goToNext"
        @clear-all-filters="clearAllFilters"
        @select-all-roles="selectAllRoles"
        @select-all-tools="selectAllTools"
      />
      
      <MessageDisplay
        :messages="filteredMessages"
        :current-index="currentIndex"
        :loading="isLoading"
        :error="error"
      />
    </main>
    
    <ErrorMessage
      v-if="error && !isLoading"
      :error="error"
      @retry="handleRetry"
      @dismiss="handleErrorDismiss"
    />
  </div>
</template>

<script>
import { onMounted, onUnmounted, computed } from 'vue'
import { useLogParser } from '@/composables/useLogParser.js'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'
import { useNavigation } from '@/composables/useNavigation.js'

import MessageIndex from './Sidebar/MessageIndex.vue'
import MessageDisplay from './MainContent/MessageDisplay.vue'
import FileUpload from './common/FileUpload.vue'
import ErrorMessage from './common/ErrorMessage.vue'

export default {
  name: 'LogViewer',
  components: {
    MessageIndex,
    MessageDisplay,
    FileUpload,
    ErrorMessage
  },
  setup() {
    // Initialize composables
    const logParser = useLogParser()
    const messageFiltering = useMessageFiltering(logParser.messages)
    const navigation = useNavigation(messageFiltering.filteredMessages)
    
    // Event handlers
    const handleFileLoad = async (file) => {
      await logParser.loadFile(file)
      // Reset navigation when new file is loaded
      navigation.goToFirst()
    }
    
    const handleKeyboard = (event) => {
      navigation.handleKeyboardNavigation(event)
    }
    
    const handleRetry = () => {
      // For now, just clear the error - could implement retry logic
      logParser.error.value = null
    }
    
    const handleErrorDismiss = () => {
      logParser.error.value = null
    }
    
    const clearAllFilters = () => {
      messageFiltering.clearAllFilters()
    }
    
    const selectAllRoles = () => {
      messageFiltering.selectAllRoles()
    }
    
    const selectAllTools = () => {
      messageFiltering.selectAllTools()
    }
    
    // Computed properties for message counts
    const roleMessageCounts = computed(() => {
      const counts = {}
      messageFiltering.availableRoles.value.forEach(role => {
        counts[role] = messageFiltering.getRoleMessageCount(role)
      })
      return counts
    })
    
    const toolMessageCounts = computed(() => {
      const counts = {}
      messageFiltering.availableTools.value.forEach(tool => {
        counts[tool] = messageFiltering.getToolMessageCount(tool)
      })
      return counts
    })
    
    // Keyboard event listener
    onMounted(() => {
      document.addEventListener('keydown', handleKeyboard)
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboard)
    })
    
    return {
      // Log parser state
      isLoading: logParser.isLoading,
      error: logParser.error,
      
      // Enhanced filtering state
      filteredMessages: messageFiltering.filteredMessages,
      availableRoles: messageFiltering.availableRoles,
      availableTools: messageFiltering.availableTools,
      selectedRoles: messageFiltering.selectedRoles,
      selectedTools: messageFiltering.selectedTools,
      searchQuery: messageFiltering.searchQuery,
      isShowingAll: messageFiltering.isShowingAll,
      filterMode: messageFiltering.filterMode,
      areAllRolesSelected: messageFiltering.areAllRolesSelected,
      areAllToolsSelected: messageFiltering.areAllToolsSelected,
      roleMessageCounts,
      toolMessageCounts,
      
      // Navigation state
      currentIndex: navigation.currentIndex,
      currentMessage: navigation.currentMessage,
      totalMessages: navigation.totalMessages,
      canGoPrevious: navigation.canGoPrevious,
      canGoNext: navigation.canGoNext,
      navigationInfo: navigation.navigationInfo,
      
      // Methods
      handleFileLoad,
      handleKeyboard,
      handleRetry,
      handleErrorDismiss,
      clearAllFilters,
      selectAllRoles,
      selectAllTools,
      goToIndex: navigation.goToIndex,
      goToPrevious: navigation.goToPrevious,
      goToNext: navigation.goToNext,
      toggleRoleFilter: messageFiltering.toggleRoleFilter,
      toggleToolFilter: messageFiltering.toggleToolFilter
    }
  }
}
</script>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  height: var(--header-height);
  flex-shrink: 0;
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .app-title {
    font-size: var(--font-size-lg);
  }
}

@media (max-width: 480px) {
  .app-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    height: auto;
    padding: var(--spacing-md);
  }
  
  .app-title {
    font-size: var(--font-size-base);
  }
}
</style>