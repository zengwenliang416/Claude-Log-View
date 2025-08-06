<template>
  <div class="log-viewer" @keydown="handleKeyboard">
    <header class="app-header">
      <!-- Glassmorphism Header Backdrop -->
      <div class="header-backdrop"></div>
      
      <!-- Brand Section -->
      <div class="brand-section">
        <div class="brand-logo">
          <div class="logo-icon">
            <img src="/logo-cyberpunk-icon.svg" alt="Claude Log Viewer" class="app-icon" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Claude Log Viewer</h1>
            <span class="brand-subtitle">Conversation Analysis Tool</span>
          </div>
        </div>
      </div>
      
      <!-- Action Section -->
      <div class="action-section">
        <FileUpload @file-loaded="handleFileLoad" :loading="isLoading" />
        <ThemeToggle variant="simple" size="md" />
      </div>
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
        :file-info="fileInfo"
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
import ThemeToggle from './ui/ThemeToggle.vue'
import { MessageSquareIcon } from 'lucide-vue-next'

export default {
  name: 'LogViewer',
  components: {
    MessageIndex,
    MessageDisplay,
    FileUpload,
    ErrorMessage,
    ThemeToggle,
    MessageSquareIcon
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
      fileInfo: logParser.fileInfo,
      
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
  overflow: hidden; /* 防止页面滚动 */
}

.app-header {
  @apply relative z-20 flex items-center justify-between;
  @apply px-4 py-2 lg:px-6;
  @apply border-b border-gray-200/50 dark:border-gray-700/50;
  @apply min-h-[48px];
  @apply flex-shrink-0;
}

.header-backdrop {
  @apply absolute inset-0 -z-10;
  @apply bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/20;
  @apply supports-[backdrop-filter]:bg-white/60;
  @apply supports-[backdrop-filter]:dark:bg-gray-900/60;
}

.brand-section {
  @apply flex items-center;
}

.brand-logo {
  @apply flex items-center gap-2;
}

.logo-icon {
  @apply flex items-center justify-center;
  @apply w-12 h-12 rounded-xl;
  @apply bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/20;
  @apply transition-all duration-200;
  @apply shadow-lg shadow-cyan-500/20;
}

.logo-icon:hover {
  @apply scale-110 shadow-2xl shadow-cyan-500/40;
  @apply border-cyan-400/30;
}

.brand-text {
  @apply flex flex-col;
}

.brand-title {
  @apply text-lg font-bold text-gray-900 dark:text-gray-100;
  @apply leading-tight;
  @apply font-semibold tracking-tight;
}

.brand-subtitle {
  @apply text-xs text-gray-600 dark:text-gray-400;
  @apply font-medium;
}

.app-icon {
  @apply w-10 h-10;
  filter: drop-shadow(0 0 12px rgba(0, 255, 255, 0.4));
  transition: all 0.3s ease;
  border-radius: 8px;
}

.app-icon:hover {
  filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.6)) drop-shadow(0 0 40px rgba(0, 255, 255, 0.3));
  transform: scale(1.15) rotate(5deg);
}

.action-section {
  @apply flex items-center gap-3;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0; /* 确保flex子元素正确处理高度 */
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    @apply px-4 py-3;
  }
  
  .brand-title {
    @apply text-lg;
  }
  
  .brand-subtitle {
    @apply text-xs;
  }
  
  .logo-icon {
    @apply w-12 h-12;
  }
  
  .app-icon {
    @apply w-8 h-8;
  }
  
  .action-section {
    @apply gap-2;
  }
}

@media (max-width: 480px) {
  .app-header {
    @apply flex-col gap-3 px-4 py-4 min-h-0;
  }
  
  .brand-section {
    @apply self-start;
  }
  
  .action-section {
    @apply self-end;
  }
  
  .brand-title {
    @apply text-base;
  }
  
  .brand-subtitle {
    @apply hidden;
  }
}
</style>