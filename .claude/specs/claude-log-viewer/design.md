# Claude Log Viewer Design Document

## Overview

The Claude Log Viewer is a Vue 3 web application designed to parse and display Claude Code conversation logs in an intuitive, searchable interface. The application follows a component-based architecture with scoped styling to ensure maintainability and prevent style conflicts.

## Architecture

### Application Structure
```
src/
├── components/
│   ├── LogViewer.vue              # Main application component
│   ├── Sidebar/
│   │   ├── MessageIndex.vue       # Left sidebar container
│   │   ├── FilterControls.vue     # Role and tool filters
│   │   ├── NavigationControls.vue # Pagination controls
│   │   └── MessageList.vue        # Message list display
│   ├── MainContent/
│   │   ├── MessageDisplay.vue     # Main message content area
│   │   ├── MessageHeader.vue      # Message metadata header
│   │   └── MessageContent.vue     # Formatted message content
│   └── common/
│       ├── FileUpload.vue         # File selection component
│       ├── LoadingSpinner.vue     # Loading indicator
│       └── ErrorMessage.vue       # Error display
├── composables/
│   ├── useLogParser.js            # Log file parsing logic
│   ├── useMessageFiltering.js     # Message filtering logic
│   ├── useNavigation.js           # Message navigation logic
│   └── useSyntaxHighlighting.js   # Code highlighting logic
├── utils/
│   ├── logParser.js               # JSONL parsing utilities
│   ├── messageTypes.js            # Message type definitions
│   └── dateFormatter.js           # Date formatting utilities
└── assets/
    └── styles/
        └── variables.module.css    # CSS custom properties
```

### State Management
The application uses Vue 3 Composition API with reactive state management:
- Messages array with parsed log data
- Current active message index
- Applied filters (role and tool types)
- Loading and error states
- File metadata

## Components and Interfaces

### 1. LogViewer.vue (Main Component)
```vue
<template>
  <div class="log-viewer">
    <header class="app-header">
      <h1>Claude Log Viewer</h1>
      <FileUpload @file-loaded="handleFileLoad" />
    </header>
    <main class="app-main">
      <MessageIndex 
        :messages="filteredMessages"
        :current-index="currentMessageIndex"
        @message-selected="setCurrentMessage"
        @filters-changed="updateFilters"
      />
      <MessageDisplay 
        :message="currentMessage"
        :loading="isLoading"
      />
    </main>
  </div>
</template>

<style scoped>
.log-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
```

### 2. MessageIndex.vue (Sidebar)
```vue
<template>
  <aside class="message-index">
    <div class="index-header">
      <h2>Message Index</h2>
    </div>
    
    <FilterControls 
      :role-filters="roleFilters"
      :tool-filters="toolFilters"
      @filters-updated="$emit('filters-changed', $event)"
    />
    
    <NavigationControls
      :current-index="currentIndex"
      :total-messages="messages.length"
      @navigate="handleNavigation"
    />
    
    <MessageList
      :messages="messages"
      :current-index="currentIndex"
      @message-click="$emit('message-selected', $event)"
    />
  </aside>
</template>

<style scoped>
.message-index {
  width: 350px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.index-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.index-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
```

### 3. FilterControls.vue
```vue
<template>
  <div class="filter-controls">
    <div class="filter-section">
      <h3>Filter by Role</h3>
      <div class="checkbox-group">
        <label v-for="role in roleOptions" :key="role.value">
          <input 
            type="checkbox" 
            :value="role.value"
            v-model="selectedRoles"
            @change="updateFilters"
          />
          <span>{{ role.label }}</span>
        </label>
      </div>
    </div>
    
    <div class="filter-section">
      <h3>Filter by Tool</h3>
      <div class="checkbox-group">
        <label v-for="tool in toolOptions" :key="tool.value">
          <input 
            type="checkbox" 
            :value="tool.value"
            v-model="selectedTools"
            @change="updateFilters"
          />
          <span>{{ tool.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-controls {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-group input[type="checkbox"] {
  accent-color: var(--accent-color);
}
</style>
```

### 4. MessageDisplay.vue
```vue
<template>
  <main class="message-display">
    <MessageHeader 
      v-if="message"
      :message="message"
    />
    
    <div class="message-content-container" v-if="message">
      <MessageContent 
        :content="message.content"
        :message-type="message.type"
      />
    </div>
    
    <div v-else-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Loading message...</p>
    </div>
    
    <div v-else class="empty-state">
      <p>Select a message to view its content</p>
    </div>
  </main>
</template>

<style scoped>
.message-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.message-content-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-secondary);
}
</style>
```

## Data Models

### Message Data Structure
```typescript
interface LogMessage {
  uuid: string;
  parentUuid?: string;
  type: 'user' | 'assistant' | 'summary' | 'tool_result';
  timestamp: string;
  sessionId: string;
  userType: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | MessageContent[];
  };
  toolUseResult?: {
    content: any;
    type: string;
  };
  summary?: string;
}

interface MessageContent {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
}

interface FilterState {
  roles: Set<string>;
  tools: Set<string>;
}

interface NavigationState {
  currentIndex: number;
  totalMessages: number;
}
```

### Component Props and Events
```typescript
// LogViewer.vue
interface LogViewerProps {}
interface LogViewerEvents {
  'file-loaded': (messages: LogMessage[]) => void;
}

// MessageIndex.vue
interface MessageIndexProps {
  messages: LogMessage[];
  currentIndex: number;
}
interface MessageIndexEvents {
  'message-selected': (index: number) => void;
  'filters-changed': (filters: FilterState) => void;
}

// FilterControls.vue
interface FilterControlsProps {
  roleFilters: Set<string>;
  toolFilters: Set<string>;
}
interface FilterControlsEvents {
  'filters-updated': (filters: FilterState) => void;
}
```

## Styling Architecture

### CSS Custom Properties (variables.module.css)
```css
:root {
  /* Colors - Dark Theme */
  --bg-primary: #1a1b1e;
  --bg-secondary: #25262b;
  --bg-tertiary: #2c2e33;
  
  --text-primary: #c1c2c5;
  --text-secondary: #909296;
  --text-muted: #5c5f66;
  
  --border-color: #373a40;
  --accent-color: #339af0;
  --success-color: #51cf66;
  --warning-color: #ffd43b;
  --error-color: #ff6b6b;
  
  /* Message Type Colors */
  --user-color: #4c6ef5;
  --assistant-color: #51cf66;
  --tool-color: #ff922b;
  --tool-result-color: #845ef7;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.12);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

### Scoped Styling Strategy
Each component uses `<style scoped>` to prevent CSS leakage:
- Component-specific styles are scoped to the component
- Shared utilities are defined in CSS modules
- CSS custom properties provide consistent theming
- No global styles except for CSS reset and custom properties

### Responsive Design Breakpoints
```css
/* Mobile-first approach */
@media (max-width: 768px) {
  .message-index {
    width: 100%;
    position: absolute;
    z-index: 10;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }
  
  .message-index.open {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.5rem 1rem;
  }
  
  .filter-controls {
    padding: 0.75rem 1rem;
  }
}
```

## Error Handling

### Error States and User Feedback
```typescript
interface ErrorState {
  type: 'file-parse' | 'file-load' | 'network' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
}

// Error handling strategy:
// 1. Graceful degradation for parse errors
// 2. Clear error messages with recovery actions
// 3. Loading states for async operations
// 4. Validation feedback for user inputs
```

### File Loading Error Handling
- Invalid file format detection
- Large file size warnings
- Parse error recovery (skip malformed entries)
- Network timeout handling
- User-friendly error messages with suggested actions

## Testing Strategy

### Component Testing
- Unit tests for all composables
- Component rendering tests
- User interaction tests
- Props and events validation
- Error state testing

### Integration Testing
- File loading and parsing workflow
- Filter and navigation functionality
- Cross-component communication
- Responsive design validation

### Performance Testing
- Large file loading performance
- Memory usage with extensive datasets
- Filtering and search performance
- Virtual scrolling validation

## Security Considerations

### File Handling Security
- Client-side file processing only
- File type validation
- Size limits for uploaded files
- Content sanitization for display
- No server-side file storage

### XSS Prevention
- Proper content escaping in templates
- Sanitized syntax highlighting
- Safe HTML rendering for message content
- Input validation for search and filters

## Performance Optimizations

### Large Dataset Handling
- Virtual scrolling for message lists
- Lazy loading of message content
- Efficient filtering algorithms
- Memory management for large logs
- Progressive parsing for huge files

### Rendering Optimizations
- Vue 3 reactivity optimizations
- Computed properties for filtered data
- Efficient re-rendering strategies
- Debounced search and filtering
- Intersection Observer for lazy loading

This design document provides a comprehensive foundation for implementing the Claude Log Viewer application with a focus on maintainable, performant, and accessible code using Vue 3 and scoped styling practices.