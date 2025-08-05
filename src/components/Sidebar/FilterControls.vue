<template>
  <div class="filter-controls">
    <!-- Filter by Role Section -->
    <div class="filter-section">
      <h3 class="filter-title">Filter by Role:</h3>
      <div class="filter-grid">
        <label
          v-for="role in availableRoles"
          :key="role"
          class="filter-switch"
        >
          <input
            type="checkbox"
            :checked="isRoleSelected(role)"
            @change="$emit('role-filter-toggle', role)"
          />
          <div class="switch-track">
            <div class="switch-thumb"></div>
            <div class="switch-glow"></div>
          </div>
          <span class="switch-label">{{ formatRoleLabel(role) }}</span>
        </label>
      </div>
    </div>
    
    <!-- Filter by Tool Section -->
    <div class="filter-section" v-if="availableTools.length > 0">
      <h3 class="filter-title">Filter by Tool:</h3>
      <div class="filter-grid">
        <label
          v-for="tool in availableTools"
          :key="tool"
          class="filter-switch"
        >
          <input
            type="checkbox"
            :checked="isToolSelected(tool)"
            @change="$emit('tool-filter-toggle', tool)"
          />
          <div class="switch-track">
            <div class="switch-thumb"></div>
            <div class="switch-glow"></div>
          </div>
          <span class="switch-label">{{ tool }}</span>
        </label>
      </div>
    </div>
    
    <!-- Navigate Messages Section -->
    <div class="navigation-section">
      <h3 class="filter-title">Navigate Messages:</h3>
      <div class="navigation-controls">
        <button 
          class="nav-button"
          :disabled="!canGoPrevious"
          @click="$emit('navigate-previous')"
        >
          ‹
        </button>
        <div class="nav-display">
          <span class="current-index">{{ currentIndex + 1 }}</span>
          <span class="nav-separator">/ {{ totalMessages }}</span>
        </div>
        <button 
          class="nav-button"
          :disabled="!canGoNext"
          @click="$emit('navigate-next')"
        >
          ›
        </button>
      </div>
    </div>
    
    <!-- 无数据时显示提示 -->
    <div v-if="availableRoles.length === 0 && availableTools.length === 0" class="no-filters">
      <span class="no-filters-text">Load a file to see filters</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterControls',
  props: {
    availableRoles: {
      type: Array,
      default: () => []
    },
    availableTools: {
      type: Array,
      default: () => []
    },
    selectedRoles: {
      type: [Array, Set],
      default: () => []
    },
    selectedTools: {
      type: [Array, Set],
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
    canGoPrevious: {
      type: Boolean,
      default: false
    },
    canGoNext: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    },
    isShowingAll: {
      type: Boolean,
      default: true
    },
    areAllRolesSelected: {
      type: Boolean,
      default: true
    },
    areAllToolsSelected: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    'role-filter-toggle',
    'tool-filter-toggle',
    'navigate-previous',
    'navigate-next',
    'search-change',
    'select-all-roles',
    'select-all-tools'
  ],
  setup(props, { emit }) {
    const formatRoleLabel = (role) => {
      const roleLabels = {
        'user': 'User',
        'assistant': 'Assistant',
        'tool': 'Tool',
        'tool_result': 'Tool Result',
        'summary': 'Summary',
        'system': 'System'
      }
      return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1)
    }

    const isRoleSelected = (role) => {
      // Handle both Array and Set types
      if (props.selectedRoles instanceof Set) {
        return props.selectedRoles.has(role)
      }
      return props.selectedRoles.includes(role)
    }

    const isToolSelected = (tool) => {
      // Handle both Array and Set types
      if (props.selectedTools instanceof Set) {
        return props.selectedTools.has(tool)
      }
      return props.selectedTools.includes(tool)
    }

    return {
      formatRoleLabel,
      isRoleSelected,
      isToolSelected
    }
  }
}
</script>

<style scoped>
.filter-controls {
  padding: 16px;
  background: transparent;
  color: inherit;
  border-radius: 8px;
  /* 移除max-height和overflow，让父容器处理滚动 */
}


.filter-section {
  margin-bottom: 20px;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 12px;
  margin-top: 0;
}

.dark .filter-title {
  color: var(--text-primary, #f3f4f6);
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 🔥 炫酷现代化滑动开关 */
.filter-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 6px;
  border-radius: 8px;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.filter-switch::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(59, 130, 246, 0.1), 
    transparent);
  transition: left 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-switch:hover::before {
  left: 100%;
}

.filter-switch:hover {
  background: rgba(59, 130, 246, 0.05);
  transform: translateX(2px);
}

.filter-switch input {
  display: none;
}

/* 开关轨道 */
.switch-track {
  width: 36px;
  height: 20px;
  background: linear-gradient(145deg, #e2e8f0, #cbd5e1);
  border-radius: 20px;
  position: relative;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    inset 2px 2px 4px rgba(0, 0, 0, 0.1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.5);
}

.dark .switch-track {
  background: linear-gradient(145deg, #374151, #4b5563);
  box-shadow: 
    inset 2px 2px 4px rgba(0, 0, 0, 0.3),
    inset -2px -2px 4px rgba(255, 255, 255, 0.1);
}

/* 开关滑块 */
.switch-thumb {
  width: 16px;
  height: 16px;
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.dark .switch-thumb {
  background: linear-gradient(145deg, #f9fafb, #e5e7eb);
}

/* 开关发光效果 */
.switch-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0;
}

/* 开关激活状态 */
.filter-switch input:checked + .switch-track {
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  box-shadow: 
    inset 1px 1px 3px rgba(0, 0, 0, 0.2),
    0 0 8px rgba(59, 130, 246, 0.3);
}

.filter-switch input:checked + .switch-track .switch-thumb {
  transform: translateX(16px);
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.15);
}

.filter-switch input:checked + .switch-track .switch-glow {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

/* 标签样式 */
.switch-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
  user-select: none;
  transition: all 200ms ease-out;
  position: relative;
}

.dark .switch-label {
  color: var(--text-secondary, #d1d5db);
}

.filter-switch:hover .switch-label {
  color: var(--accent-color, #3b82f6);
  transform: translateX(1px);
}

.filter-switch input:checked ~ .switch-label {
  color: var(--accent-color, #3b82f6);
  font-weight: 600;
}

/* 激活动画 */
@keyframes switch-bounce {
  0% { transform: translateX(16px) scale(1); }
  50% { transform: translateX(16px) scale(1.1); }
  100% { transform: translateX(16px) scale(1); }
}

.filter-switch input:checked + .switch-track .switch-thumb {
  animation: switch-bounce 300ms ease-out;
}

/* Navigation Section */
.navigation-section {
  margin-bottom: 20px;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color, #d1d5db);
  background: var(--bg-secondary, #f9fafb);
  color: var(--text-primary, #1f2937);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.dark .nav-button {
  border-color: var(--border-color, #6b7280);
  background: var(--bg-secondary, #374151);
  color: var(--text-primary, #f3f4f6);
}

.nav-button:hover:not(:disabled) {
  background: var(--accent-color, #3b82f6);
  border-color: var(--accent-color, #3b82f6);
  color: white;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-display {
  flex: 1;
  text-align: center;
  background: var(--bg-tertiary, #f3f4f6);
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color, #d1d5db);
}

.dark .nav-display {
  background: var(--bg-tertiary, #1f2937);
  border-color: var(--border-color, #6b7280);
}

.current-index {
  color: var(--text-primary, #1f2937);
  font-weight: bold;
}

.dark .current-index {
  color: var(--text-primary, #f3f4f6);
}

.nav-separator {
  color: var(--text-muted, #9ca3af);
}

.dark .nav-separator {
  color: var(--text-muted, #6b7280);
}

/* 无筛选器时的提示 */
.no-filters {
  text-align: center;
  padding: 20px;
  color: var(--text-muted, #9ca3af);
  font-style: italic;
}

.dark .no-filters {
  color: var(--text-muted, #6b7280);
}

.no-filters-text {
  font-size: 14px;
}
</style>