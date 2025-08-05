<template>
  <aside 
    class="message-index" 
    :class="{ 
      'message-index--collapsed': isCollapsed,
      'message-index--mobile-open': isMobileOpen 
    }"
  >
    <!-- Glassmorphism Sidebar Backdrop -->
    <div class="sidebar-backdrop"></div>
    
    <!-- Sidebar Header -->
    <header class="sidebar-header">
      <div class="header-content">
        <!-- 展开状态下的品牌区域 -->
        <div v-if="!isCollapsed" class="header-brand">
          <div class="brand-icon">
            <LayersIcon :size="20" class="text-primary-600 dark:text-primary-400" />
          </div>
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 -translate-x-1"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 -translate-x-1"
          >
            <div class="header-text">
              <h2 class="header-title">Message Index</h2>
            </div>
          </Transition>
        </div>
        
        <!-- Collapse Toggle -->
        <Button
          variant="ghost"
          size="sm"
          @click="toggleCollapse"
          :class="[
            'collapse-button',
            { 'collapse-button--centered': isCollapsed }
          ]"
          :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <ChevronLeftIcon 
            :size="16" 
            :class="{ 'rotate-180': isCollapsed }"
            class="transition-transform duration-200"
          />
        </Button>
      </div>
    </header>
    
    <!-- File Info Display -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="fileInfo.name && !isCollapsed" class="file-info-sidebar">
        <div class="file-indicator-sidebar">
          <FileTextIcon :size="12" class="file-icon" />
          <span class="file-name-sidebar">{{ fileInfo.name }}</span>
        </div>
      </div>
    </Transition>
    
    <!-- Sidebar Content -->
    <div class="sidebar-content">
      
      <!-- Filter Controls Section -->
      <Transition
        enter-active-class="transition-all duration-400 ease-out"
        enter-from-class="opacity-0 -translate-y-8 scale-90 rotate-3"
        enter-to-class="opacity-100 translate-y-0 scale-100 rotate-0"
        leave-active-class="transition-all duration-250 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100 rotate-0"
        leave-to-class="opacity-0 -translate-y-8 scale-90 rotate-3"
      >
        <div v-if="!isCollapsed" class="filters-section">
          <FilterControls
            :available-roles="availableRoles"
            :available-tools="availableTools"
            :selected-roles="selectedRoles"
            :selected-tools="selectedTools"
            :current-index="currentIndex"
            :total-messages="totalMessages"
            :can-go-previous="canGoPrevious"
            :can-go-next="canGoNext"
            :search-query="searchQuery"
            :role-message-counts="roleMessageCounts"
            :tool-message-counts="toolMessageCounts"
            :is-showing-all="isShowingAll"
            :filter-mode="filterMode"
            :are-all-roles-selected="areAllRolesSelected"
            :are-all-tools-selected="areAllToolsSelected"
            @role-filter-toggle="$emit('role-filter-toggle', $event)"
            @tool-filter-toggle="$emit('tool-filter-toggle', $event)"
            @navigate-previous="$emit('navigate-previous')"
            @navigate-next="$emit('navigate-next')"
            @search-change="$emit('search-change', $event)"
            @clear-all-filters="$emit('clear-all-filters')"
            @select-all-roles="$emit('select-all-roles')"
            @select-all-tools="$emit('select-all-tools')"
          />
        </div>
      </Transition>
      
      
      <!-- Message List Section -->
      <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-8 scale-95 -rotate-2"
        enter-to-class="opacity-100 translate-y-0 scale-100 rotate-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100 rotate-0"
        leave-to-class="opacity-0 translate-y-8 scale-95 -rotate-2"
      >
        <div v-if="!isCollapsed" class="message-list-section">
          <MessageList
            :messages="messages"
            :current-index="currentIndex"
            @message-click="$emit('message-selected', $event)"
          />
        </div>
      </Transition>
      
      <!-- Collapsed State Icons -->
      <div v-if="isCollapsed" class="collapsed-icons">
        <Button
          variant="ghost"
          size="sm"
          @click="expandAndFocusSearch"
          class="collapsed-icon-button"
          :aria-label="'Search messages'"
        >
          <SearchIcon :size="18" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('navigate-previous')"
          :disabled="!canGoPrevious"
          class="collapsed-icon-button"
          :aria-label="'Previous message'"
        >
          <ChevronUpIcon :size="18" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('navigate-next')"
          :disabled="!canGoNext"
          class="collapsed-icon-button"
          :aria-label="'Next message'"
        >
          <ChevronDownIcon :size="18" />
        </Button>
      </div>
    </div>
    
    <!-- Mobile Backdrop -->
    <div 
      v-if="isMobileOpen" 
      class="mobile-backdrop"
      @click="closeMobileSidebar"
    ></div>
  </aside>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useMediaQuery, useLocalStorage } from '@vueuse/core'
import FilterControls from './FilterControls.vue'
import NavigationControls from './NavigationControls.vue'
import MessageList from './MessageList.vue'
import { Button, Input, Card } from '@/components/ui'
import { 
  LayersIcon, 
  ChevronLeftIcon, 
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FileTextIcon
} from 'lucide-vue-next'

const props = defineProps({
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
  },
  fileInfo: {
    type: Object,
    default: () => ({ name: '', size: 0 })
  }
})

const emit = defineEmits([
  'message-selected',
  'role-filter-toggle',
  'tool-filter-toggle',
  'search-change',
  'navigate-previous',
  'navigate-next',
  'clear-all-filters',
  'select-all-roles',
  'select-all-tools'
])

// Reactive state
const isCollapsed = useLocalStorage('sidebar-collapsed', false)
const isMobileOpen = ref(false)
const isMobile = useMediaQuery('(max-width: 768px)')
const searchInputRef = ref(null)

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const expandAndFocusSearch = async () => {
  isCollapsed.value = false
  await nextTick()
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

const closeMobileSidebar = () => {
  isMobileOpen.value = false
}
</script>

<style scoped>
/* Main sidebar container */
.message-index {
  @apply relative z-20 flex flex-col overflow-hidden;
  @apply w-80 flex-shrink-0;
  @apply border-r border-gray-200/50 dark:border-gray-700/50;
  min-height: 0; /* 确保flex布局正确 */
  height: 100vh; /* 确保占满全高 */
  /* 炫酷动画效果 */
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  will-change: width, transform, box-shadow;
  transform: translateZ(0); /* 启用硬件加速 */
  /* 添加微妙的阴影和边框效果 */
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.message-index--collapsed {
  @apply w-16;
  /* 折叠时的炫酷效果 */
  transform: translateZ(0) scale(0.98);
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  /* 添加微妙的脉冲效果 */
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% {
    box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 1px 0 8px rgba(59, 130, 246, 0.2);
  }
}

/* Glassmorphism backdrop */
.sidebar-backdrop {
  @apply absolute inset-0 -z-10;
  /* 炫酷渐变背景 */
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(248, 250, 252, 0.98) 100%);
  transform: translateZ(0); /* 启用硬件加速 */
  transition: all 300ms ease-out;
}

/* 暗色模式的背景 */
.dark .sidebar-backdrop {
  background: linear-gradient(135deg, 
    rgba(17, 24, 39, 0.95) 0%, 
    rgba(31, 41, 55, 0.98) 100%);
}

/* 展开时的背景效果 */
.message-index:not(.message-index--collapsed) .sidebar-backdrop {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(248, 250, 252, 1) 100%);
}

.dark .message-index:not(.message-index--collapsed) .sidebar-backdrop {
  background: linear-gradient(135deg, 
    rgba(17, 24, 39, 0.98) 0%, 
    rgba(31, 41, 55, 1) 100%);
}

/* 折叠时的背景效果 */
.message-index--collapsed .sidebar-backdrop {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(147, 197, 253, 0.05) 100%);
}

.dark .message-index--collapsed .sidebar-backdrop {
  background: linear-gradient(135deg, 
    rgba(30, 58, 138, 0.2) 0%, 
    rgba(30, 64, 175, 0.1) 100%);
}

/* Sidebar header */
.sidebar-header {
  @apply relative z-10 flex-shrink-0;
  @apply px-4 py-4 lg:px-6;
  @apply border-b border-gray-200/50 dark:border-gray-700/50;
}

.header-content {
  @apply flex items-center;
  /* 动态调整justify方式 */
}

.message-index:not(.message-index--collapsed) .header-content {
  @apply justify-between;
}

.message-index--collapsed .header-content {
  @apply justify-center;
  width: 100%;
}

.header-brand {
  @apply flex items-center gap-3 min-w-0;
}

.brand-icon {
  @apply flex items-center justify-center flex-shrink-0;
  @apply w-10 h-10 rounded-xl;
  /* 简化背景样式，避免复杂的滤镜 */
  background: rgba(255, 255, 255, 0.1);
  @apply dark:bg-gray-800/50;
  border: 1px solid rgba(255, 255, 255, 0.2);
  @apply dark:border-gray-600/50;
  transition: transform 150ms ease-out;
  transform: translateZ(0); /* 启用硬件加速 */
}

.brand-icon:hover {
  transform: scale(1.05) translateZ(0);
}

.header-text {
  @apply flex flex-col min-w-0;
}

.header-title {
  @apply text-lg font-bold text-gray-900 dark:text-gray-100;
  @apply leading-tight font-semibold tracking-tight;
}

.header-subtitle {
  @apply text-xs text-gray-600 dark:text-gray-400;
  @apply font-medium mt-0.5;
}

.collapse-button {
  @apply flex-shrink-0 ml-2;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.collapse-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  transition: all 300ms ease-out;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  z-index: -1;
}

.collapse-button:hover::before {
  width: 40px;
  height: 40px;
}

.collapse-button--centered {
  @apply ml-0;
  /* 在折叠状态下居中显示 */
  margin: 0 auto;
  /* 折叠状态下的特殊效果 */
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.collapse-button--centered:hover {
  transform: scale(1.2) rotate(5deg);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* Sidebar content */
.sidebar-content {
  @apply flex-1 flex flex-col;
  @apply px-4 lg:px-6;
  min-height: 0; /* 重要：让flex子元素正确处理溢出 */
  overflow-y: auto;
  overflow-x: hidden;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

/* Webkit 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 暗色模式滚动条 */
.dark .sidebar-content {
  scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}

.dark .sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.4);
}

.dark .sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.6);
}

.search-section {
  @apply py-4;
}

.search-card {
  @apply shadow-sm hover:shadow-md transition-shadow duration-200;
}

.filters-section {
  @apply flex-shrink-0;
  /* 不再需要flex-1，让内容自然占用空间 */
  overflow: visible;
}

.navigation-section {
  @apply py-4 border-t border-gray-200/50 dark:border-gray-700/50;
  @apply flex-shrink-0;
}

.message-list-section {
  @apply flex-shrink-0;
  @apply border-t border-gray-200/50 dark:border-gray-700/50;
  @apply pt-4;
  /* 让MessageList组件自己处理高度和滚动 */
}

/* Collapsed state */
.collapsed-icons {
  @apply flex flex-col gap-2 py-4;
  @apply items-center;
}

.collapsed-icon-button {
  @apply w-10 h-10 rounded-xl;
  transition: all 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: translateZ(0);
  position: relative;
  overflow: hidden;
}

.collapsed-icon-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  animation: spin-glow 3s linear infinite;
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.collapsed-icon-button:hover::before {
  opacity: 1;
}

@keyframes spin-glow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.collapsed-icon-button:hover {
  transform: scale(1.15) rotate(10deg) translateZ(0);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.collapsed-icon-button:disabled {
  @apply opacity-40 cursor-not-allowed;
  transform: translateZ(0);
}

.collapsed-icon-button:disabled::before {
  display: none;
}

/* Mobile responsive behavior */
@media (max-width: 768px) {
  .message-index {
    @apply fixed inset-y-0 left-0 z-40;
    @apply w-80 max-w-[85vw];
    @apply transform -translate-x-full;
    @apply border-r-0 shadow-2xl;
  }
  
  .message-index--mobile-open {
    @apply translate-x-0;
  }
  
  .sidebar-backdrop {
    @apply bg-white/95 dark:bg-gray-900/95;
    @apply backdrop-blur-xl backdrop-saturate-150;
  }
}

.mobile-backdrop {
  @apply fixed inset-0 z-30;
  @apply bg-black/20 dark:bg-black/40;
  @apply backdrop-blur-sm;
  @apply transition-all duration-300;
}

/* Collapsed state mobile adjustments */
@media (max-width: 768px) {
  .message-index--collapsed {
    @apply w-16;
  }
}

/* Animation improvements */
.message-index * {
  @apply transition-colors duration-200;
}

/* Focus states for accessibility */
.collapse-button:focus-visible,
.collapsed-icon-button:focus-visible {
  @apply ring-2 ring-primary-500/50 ring-offset-2;
  @apply ring-offset-white dark:ring-offset-gray-900;
}

/* Smooth transitions for all interactive elements */
.header-brand, 
.search-card, 
.collapsed-icon-button {
  @apply transition-all duration-200 ease-out;
}

/* Enhanced hover states */
.search-card:hover {
  @apply bg-white/80 dark:bg-gray-800/80;
}

/* Loading and empty states */
.sidebar-content:empty::after {
  @apply block text-center text-gray-500 dark:text-gray-400;
  @apply text-sm font-medium py-8;
  content: 'No messages to display';
}

/* Responsive typography */
@media (max-width: 480px) {
  .header-title {
    @apply text-base;
  }
  
  .header-subtitle {
    @apply text-xs;
  }
  
  .sidebar-header {
    @apply px-3 py-3;
  }
  
  .sidebar-content {
    @apply px-3;
  }
}

/* Performance optimizations */
.message-index * {
  /* 优化渲染性能 */
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .message-index,
  .message-index *,
  .sidebar-backdrop,
  .brand-icon,
  .collapsed-icon-button {
    transition: none !important;
    transform: none !important;
    animation: none !important;
  }
}

/* 侧边栏文件信息显示 */
.file-info-sidebar {
  @apply px-4 py-2;
  @apply border-b border-gray-200/50 dark:border-gray-700/50;
}

.file-indicator-sidebar {
  @apply flex items-center gap-2;
  @apply px-2 py-1;
  @apply bg-green-50 dark:bg-green-900/20;
  @apply border border-green-200 dark:border-green-800;
  @apply rounded-md;
}

.file-icon {
  @apply text-green-600 dark:text-green-400;
  @apply flex-shrink-0;
}

.file-name-sidebar {
  @apply text-xs font-medium;
  @apply text-green-800 dark:text-green-200;
  @apply truncate;
  @apply flex-1;
}
</style>