<template>
  <div class="filter-controls">
    <!-- Search Input -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <input
          type="text"
          class="search-input"
          placeholder="Search messages..."
          :value="searchQuery"
          @input="$emit('search-change', $event.target.value)"
        />
        <div class="search-icon">🔍</div>
      </div>
    </div>
    
    <!-- Role Filters -->
    <div class="filter-section">
      <div class="filter-header">
        <h3 class="filter-title">Filter by Role</h3>
        <button 
          v-if="!areAllRolesSelected" 
          class="select-all-btn"
          @click="$emit('select-all-roles')"
        >
          Select All
        </button>
      </div>
      <div class="checkbox-grid" :class="getRoleGridClass()">
        <label
          v-for="role in availableRoles"
          :key="role"
          class="checkbox-label"
          :class="{ 'checked': isRoleSelected(role) }"
        >
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              class="checkbox-input"
              :checked="isRoleSelected(role)"
              @change="$emit('role-filter-toggle', role)"
            />
            <div class="checkbox-custom"></div>
          </div>
          <span class="checkbox-text">{{ formatRoleLabel(role) }}</span>
        </label>
      </div>
    </div>
    
    <!-- Tool Filters -->
    <div class="filter-section" v-if="availableTools.length > 0">
      <div class="filter-header">
        <h3 class="filter-title">Filter by Tool</h3>
        <button 
          v-if="!areAllToolsSelected" 
          class="select-all-btn"
          @click="$emit('select-all-tools')"
        >
          Select All
        </button>
      </div>
      <div class="checkbox-grid" :class="getToolGridClass()">
        <label
          v-for="tool in availableTools"
          :key="tool"
          class="checkbox-label"
          :class="{ 'checked': isToolSelected(tool) }"
        >
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              class="checkbox-input"
              :checked="isToolSelected(tool)"
              @change="$emit('tool-filter-toggle', tool)"
            />
            <div class="checkbox-custom"></div>
          </div>
          <span class="checkbox-text">{{ tool }}</span>
        </label>
      </div>
    </div>
    
    <!-- Filter Actions -->
    <div class="filter-actions">
      <button 
        v-if="!isShowingAll" 
        class="clear-button primary"
        @click="clearAllFilters"
      >
        Show All Messages
      </button>
      <div v-if="isShowingAll" class="showing-all-indicator">
        <span class="indicator-icon">✓</span>
        <span class="indicator-text">Showing all message types</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

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
    'role-filter-toggle',
    'tool-filter-toggle',
    'search-change',
    'clear-all-filters',
    'select-all-roles',
    'select-all-tools'
  ],
  setup(props, { emit }) {
    const hasActiveFilters = computed(() => {
      return !props.isShowingAll
    })
    
    const formatRoleLabel = (role) => {
      const labels = {
        'user': 'User',
        'assistant': 'Assistant',
        'tool': 'Tool',
        'tool_result': 'Tool Result',
        'summary': 'Summary'
      }
      return labels[role] || role.charAt(0).toUpperCase() + role.slice(1)
    }
    

    const clearAllFilters = () => {
      // Emit a single event to clear all filters
      emit('clear-all-filters')
    }
    
    const isRoleSelected = (role) => {
      return props.selectedRoles.has(role)
    }
    
    const isToolSelected = (tool) => {
      return props.selectedTools.has(tool)
    }
    
    /**
     * 计算角色筛选器的网格布局类
     * 优化布局：避免单列显示，优先使用多列布局提升视觉效果
     */
    const getRoleGridClass = () => {
      try {
        const count = props.availableRoles?.length || 0;
        return {
          'single-column': count === 0 || count === 1, // 仅在没有或只有1个项目时使用单列
          'multi-column': count >= 2 && count <= 11,   // 2个或以上项目使用多列布局
          'dense-grid': count >= 12,
          'force-single': count === 0
        };
      } catch (error) {
        console.warn('FilterControls: Error calculating role grid class', error);
        return { 'multi-column': true }; // 改为多列作为安全回退
      }
    };
    
    /**
     * 计算工具筛选器的网格布局类
     * 优化布局：避免单列显示，优先使用多列布局提升视觉效果
     */
    const getToolGridClass = () => {
      try {
        const count = props.availableTools?.length || 0;
        return {
          'single-column': count === 0 || count === 1, // 仅在没有或只有1个项目时使用单列
          'multi-column': count >= 2 && count <= 11,   // 2个或以上项目使用多列布局
          'dense-grid': count >= 12,
          'force-single': count === 0
        };
      } catch (error) {
        console.warn('FilterControls: Error calculating tool grid class', error);
        return { 'multi-column': true }; // 改为多列作为安全回退
      }
    };
    
    return {
      hasActiveFilters,
      formatRoleLabel,
      clearAllFilters,
      isRoleSelected,
      isToolSelected,
      getRoleGridClass,
      getToolGridClass
    }
  }
}
</script>

<style scoped>
/* Enhanced Filter Controls Container */
.filter-controls {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.filter-controls::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
  opacity: 0.5;
}

/* Enhanced Search Section */
.search-section {
  margin-bottom: var(--spacing-xl);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  padding-right: calc(var(--spacing-lg) + 24px);
  background-color: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal);
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-focus);
  background-color: var(--bg-secondary);
}

.search-input::placeholder {
  color: var(--text-muted);
  font-weight: var(--font-weight-normal);
}

.search-icon {
  position: absolute;
  right: var(--spacing-md);
  color: var(--text-muted);
  font-size: var(--font-size-lg);
  pointer-events: none;
  transition: color var(--transition-fast);
}

.search-input:focus + .search-icon {
  color: var(--accent-color);
}

/* Enhanced Filter Sections */
.filter-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all var(--transition-normal);
}

.filter-section:hover {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.filter-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  border-radius: 2px;
}

.select-all-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.select-all-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background-color: rgba(51, 154, 240, 0.1);
}

/* Enhanced Multi-Column Filter Layout */
.filter-section {
  container-type: inline-size;
}

/* Base Grid Layout - Multi-Column by Default */
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--filter-grid-min-column-width), 1fr));
  gap: var(--filter-grid-gap-vertical) var(--filter-grid-gap-horizontal);
}

/* Single Column for Very Small Containers or Force Single */
.checkbox-grid.single-column,
.checkbox-grid.force-single {
  grid-template-columns: 1fr;
  gap: var(--filter-grid-gap-vertical);
}

/* Multi-Column Grid (Explicit) */
.checkbox-grid.multi-column {
  grid-template-columns: repeat(auto-fit, minmax(var(--filter-grid-min-column-width), 1fr));
  gap: var(--filter-grid-gap-vertical) var(--filter-grid-gap-horizontal);
}

/* Dense Grid for Large Datasets */
@container (min-width: 400px) {
  .checkbox-grid.dense-grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--filter-grid-dense-min-width), 1fr));
    gap: var(--filter-grid-gap-vertical) var(--filter-grid-gap-horizontal);
  }
}

/* Flexbox Fallback for Older Browsers */
@supports not (container-type: inline-size) {
  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }
  
  .checkbox-grid.multi-column .checkbox-label {
    flex: 1 1 var(--filter-grid-min-column-width);
    min-width: var(--filter-grid-min-column-width);
    max-width: 200px;
  }
}

/* Grid Support Detection */
@supports not (display: grid) {
  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }
  
  .checkbox-label {
    flex: 1 1 var(--filter-grid-min-column-width);
    min-width: var(--filter-grid-min-column-width);
    max-width: 200px;
  }
}

/* Smooth Transitions */
.checkbox-grid {
  transition: grid-template-columns var(--transition-normal);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  transition: all var(--transition-fast);
  position: relative;
  min-height: var(--touch-target-md);
}

.checkbox-label:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.checkbox-label.checked {
  background-color: rgba(51, 154, 240, 0.1);
  border: 1px solid rgba(51, 154, 240, 0.2);
}

.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  transition: all var(--transition-fast);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-input:checked + .checkbox-custom {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: var(--shadow-focus);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.checkbox-input:focus + .checkbox-custom {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.checkbox-text {
  flex: 1;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}


/* Enhanced Filter Actions */
.filter-actions {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  border: none;
  border-radius: var(--border-radius-lg);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.clear-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-slow);
}

.clear-button:hover::before {
  left: 100%;
}

.clear-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.clear-button:active {
  transform: translateY(0);
}

.showing-all-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(81, 207, 102, 0.1);
  border: 1px solid rgba(81, 207, 102, 0.2);
  border-radius: var(--border-radius-lg);
  color: var(--success-color);
}

.indicator-icon {
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.indicator-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Responsive Design for Different Screen Sizes */
/* Mobile: Single column layout for very small screens */
@media (max-width: 479px) {
  .checkbox-grid {
    grid-template-columns: 1fr !important;
    gap: var(--filter-grid-gap-vertical) !important;
  }
}

/* Tablet and Desktop: Multi-column layout */
@media (min-width: 480px) {
  .checkbox-grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--filter-grid-min-column-width), 1fr)) !important;
    gap: var(--filter-grid-gap-vertical) var(--filter-grid-gap-horizontal) !important;
  }
  
  .checkbox-grid.dense-grid {
    grid-template-columns: repeat(auto-fit, minmax(var(--filter-grid-dense-min-width), 1fr)) !important;
    gap: var(--filter-grid-gap-vertical) var(--filter-grid-gap-horizontal) !important;
  }
  
  /* Override single-column class only on larger screens when explicitly needed */
  .checkbox-grid.force-single {
    grid-template-columns: 1fr !important;
    gap: var(--filter-grid-gap-vertical) !important;
  }
}

/* Responsive Design Improvements */
@media (max-width: 768px) {
  .filter-controls {
    padding: var(--spacing-md);
  }
  
  .checkbox-label {
    min-height: var(--touch-target-lg);
    padding: var(--spacing-md);
  }
  
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .select-all-btn {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .search-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .checkbox-label {
    min-height: var(--touch-target-xl);
  }
}

/* Dark theme enhancements */
@media (prefers-color-scheme: dark) {
  .filter-controls {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .checkbox-custom {
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .search-input {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .checkbox-custom {
    border-width: 3px;
  }
  
  .checkbox-input:focus + .checkbox-custom {
    outline-width: 3px;
  }
  
  .filter-section {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
  
  .clear-button::before {
    display: none;
  }
}
</style>