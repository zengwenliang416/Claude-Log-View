<div align="center">
  <img src="public/logo-github-header.svg" alt="Claude Log Viewer" width="400"/>
</div>


# 🚀 Claude Log Viewer

## Languages

| Language | README |
|----------|--------|
| 🇺🇸 **English** | [README.md](README.md) (Current) |
| 🇨🇳 中文 | [docs/README-zh.md](docs/README-zh.md) |

> **A sophisticated Vue 3 application for visualizing Claude Code conversation logs with advanced performance optimizations and comprehensive testing**

[![Vue 3](https://img.shields.io/badge/Vue-3.4.0-4FC08D.svg?style=flat&logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3.4-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-ESM-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.179-000000.svg?style=flat&logo=three.js)](https://threejs.org/)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/zengwenliang416/Claude-Log-View/actions/workflows/ci.yml/badge.svg)](https://github.com/zengwenliang416/Claude-Log-View/actions/workflows/ci.yml)
[![Quality Gate](https://github.com/zengwenliang416/Claude-Log-View/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/zengwenliang416/Claude-Log-View/actions/workflows/quality-gate.yml)
[![Quality Score](https://img.shields.io/badge/Quality%20Score-98.7%25-brightgreen.svg)](tests/TESTING_SUMMARY.md)
[![Performance](https://img.shields.io/badge/Performance-70%25%20Faster-orange.svg)](PERFORMANCE_IMPROVEMENTS.md)
[![Security](https://img.shields.io/badge/Security-Hardened-blue.svg)](SECURITY.md)
[![Contributing](https://img.shields.io/badge/Contributing-Welcome-ff69b4.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Contributor%20Covenant-green.svg)](CODE_OF_CONDUCT.md)

---

## ✨ Overview

Claude Log Viewer is a **cutting-edge Vue 3 web application** designed for parsing, analyzing, and visualizing Claude Code conversation logs in JSONL format. Built with modern web technologies and optimized for performance, it offers a sophisticated interface with **3D backgrounds**, **glass-morphism effects**, and **advanced filtering capabilities**.

### 🎯 Key Highlights

- **🏗️ Modern Architecture**: Vue 3 Composition API with TypeScript-style patterns
- **⚡ Performance Optimized**: 70%+ search improvement through MessageContentCache
- **🧪 Comprehensive Testing**: 98.7% quality score with extensive test coverage
- **🎨 Modern UI/UX**: 3D backgrounds, glass-morphism effects, and responsive design
- **♿ Accessibility First**: Web Content Accessibility Guidelines (WCAG) 2.1 AA compliance with full keyboard navigation
- **🚀 Production Ready**: Robust error handling and recovery mechanisms

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📊 Performance](#-performance)
- [🧪 Testing](#-testing)
- [💻 Development](#-development)
- [📚 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)
- [🛡️ Security](#-security)
- [📞 Support](#-support)
- [📜 Code of Conduct](#-code-of-conduct)
- [📄 License](#-license)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** `16.x` or higher
- **npm** `7.x` or **yarn** `1.22.x`

### Installation

```bash
# Clone the repository
git clone https://github.com/zengwenliang416/Claude-Log-View.git
cd Claude-Log-View

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ✨ Features

### 🎨 **Modern User Interface**
- **3D Background Effects**: Interactive Three.js-powered background with dynamic lighting
- **Glass-morphism Design**: Modern frosted-glass aesthetics with backdrop blur effects  
- **Responsive Layout**: Seamless experience across desktop, tablet, and mobile devices
- **Dark/Light Theme**: System-aware theming with manual toggle support
- **Smooth Animations**: 60fps animations with `will-change` optimizations

### ⚡ **Performance Optimizations**
- **MessageContentCache**: Advanced caching system providing 70%+ search performance improvement
- **FilteringEngine**: Centralized filtering logic eliminating 80% code duplication
- **Virtual Scrolling**: Efficient rendering of large message lists
- **Debounced Search**: 300ms debounced search with intelligent query optimization
- **Memory Management**: LRU cache eviction and automatic optimization

### 🔍 **Advanced Filtering & Navigation**
- **Multi-Role Filtering**: Filter by User, Assistant, Tool, Tool Result, and Summary messages
- **Tool-Specific Filters**: Granular filtering by tool types (Bash, Edit, Read, Write, etc.)
- **Intelligent Search**: Full-text search with syntax highlighting and context preservation
- **Keyboard Navigation**: Full keyboard support with customizable shortcuts
- **Index Mapping**: Bidirectional index mapping between filtered and original message arrays

### 📁 **File Management**
- **Drag & Drop**: Intuitive file loading with visual feedback
- **Format Support**: Primary JSONL support with JSON fallback
- **Size Optimization**: Efficient parsing of files up to 50 MB with streaming
- **Error Recovery**: Robust parsing with detailed error reporting and recovery options
- **Format Validation**: Comprehensive JSON Lines (JSONL) format validation and correction

### 🛡️ **Reliability & Testing**
- **Error Boundaries**: Comprehensive error catching with automatic retry mechanisms
- **98.7% Quality Score**: Extensive testing with unit, integration, E2E, and performance tests
- **Accessibility**: Web Content Accessibility Guidelines (WCAG) 2.1 AA compliance with screen reader support
- **Cross-Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Memory Safety**: Proactive memory management and leak detection

---

## 🏗️ Architecture

<details>
<summary><strong>📋 Component Hierarchy & Core Systems</strong></summary>

### Component Hierarchy

```mermaid
graph TB
    A[App.vue] --> B[LogViewer.vue]
    A --> C[ThreeBackground.vue]
    A --> D[ThemeToggle.vue]
    
    B --> E[Sidebar/MessageIndex.vue]
    B --> F[MainContent/MessageDisplay.vue]
    
    E --> G[Sidebar/FilterControls.vue]
    E --> H[Sidebar/NavigationControls.vue]
    E --> I[Sidebar/MessageList.vue]
    
    F --> J[MainContent/MessageHeader.vue]
    F --> K[MainContent/MessageContent.vue]
    
    B --> L[common/FileUpload.vue]
    B --> M[common/ErrorBoundary.vue]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

### 🧩 Core Systems

#### **📦 Composables Architecture**
```typescript
// useMessageFiltering.js - Advanced filtering system
const filtering = useMessageFiltering(messages)
filtering.getPerformanceMetrics() // Cache hit rates, processing time
filtering.getFilteringStats()     // Filter effectiveness metrics
filtering.optimize()             // Manual cache optimization

// useNavigation.js - Robust navigation system  
const navigation = useNavigation(messages)
navigation.validateNavigationState() // State integrity check
navigation.performHealthCheck()      // System diagnostics
navigation.getErrorState()           // Detailed error tracking
```

#### **⚡ Performance Utilities**
```typescript
// MessageContentCache.js - High-performance content caching
const cache = new MessageContentCache({
  maxSize: 2000,
  enableMetrics: true,
  evictionPolicy: 'LRU'
})

// FilteringEngine.js - Centralized filtering logic
const engine = new FilteringEngine(contentCache)
const results = engine.processMessages(messages, filters)
// Returns: { filteredMessages, filteredToOriginalMap, originalToFilteredMap, stats }
```

### 📁 Project Structure

```
src/
├── components/
│   ├── common/                 # Shared components
│   │   ├── ErrorBoundary.vue   # Error handling & recovery
│   │   ├── FileUpload.vue      # Drag & drop file loading
│   │   └── LoadingSpinner.vue  # Loading indicators
│   ├── ui/                     # UI component library
│   │   ├── Button.vue          # Modern button components
│   │   ├── Card.vue           # Glass card containers
│   │   ├── ThreeBackground.vue # 3D background system
│   │   └── ThemeToggle.vue    # Theme switching
│   ├── Sidebar/               # Left sidebar components
│   │   ├── MessageIndex.vue   # Container component
│   │   ├── FilterControls.vue # Advanced filtering UI
│   │   ├── NavigationControls.vue # Pagination controls
│   │   └── MessageList.vue    # Virtual scrolling message list
│   └── MainContent/           # Main content area
│       ├── MessageDisplay.vue # Content container
│       ├── MessageHeader.vue  # Message metadata & actions
│       └── MessageContent.vue # Syntax-highlighted content
├── composables/               # Vue 3 Composition API
│   ├── useMessageFiltering.js # Advanced filtering logic
│   ├── useNavigation.js       # Navigation management
│   ├── useLogParser.js        # JSONL parsing utilities
│   ├── useSyntaxHighlighting.js # Code highlighting
│   ├── useTheme.js           # Theme management
│   └── useVirtualScrolling.js # Performance scrolling
├── utils/                     # Core utilities
│   ├── MessageContentCache.js # Performance caching system
│   ├── FilteringEngine.js     # Centralized filtering
│   ├── logParser.js          # JSONL processing
│   ├── messageTypes.js       # Message type definitions
│   └── logger.js             # Development logging
└── assets/                   # Static assets
    └── styles/               # CSS architecture
        ├── tailwind.css      # Modern CSS framework
        ├── variables.css     # Design system tokens
        ├── highlight.css     # Syntax highlighting themes
        └── performance-optimizations.css # Performance CSS
```

</details>

---

## 📊 Performance

### 🚀 **Benchmark Results**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Search Operations** | ~2.3 s | ~0.7 s | **70%+ faster** |
| **Initial Load Time** | ~1.8 s | ~0.9 s | **50% faster** |
| **Memory Usage** | ~45 MB | ~28 MB | **38% reduction** |
| **Bundle Size** | ~1.8 MB | ~1.2 MB | **33% smaller** |

<details>
<summary><strong>⚡ Core Optimizations & Implementation Details</strong></summary>

### ⚡ **Core Optimizations**

#### **MessageContentCache System**
```javascript
// Advanced content caching with LRU eviction
const cache = new MessageContentCache({
  maxSize: 2000,        // Optimal cache size
  enableMetrics: true,  // Performance tracking
  hitRateTarget: 0.85   // 85% cache hit rate target
})

// Eliminates repeated JSON.stringify calls
// Provides 70%+ search performance improvement
const searchResults = cache.messageMatchesSearch(message, query)
```

#### **FilteringEngine Architecture** 
```javascript
// Single-pass processing eliminates code duplication
const results = filteringEngine.processMessages(messages, filters)

// Returns optimized data structures:
// - filteredMessages: O(1) access
// - bidirectional index mapping: O(1) lookups  
// - performance statistics: real-time metrics
```

#### **Virtual Scrolling Implementation**
- **Viewport-based rendering**: Only visible items in DOM
- **Smooth scrolling**: 60fps with `transform3d` optimization
- **Dynamic item heights**: Flexible content with accurate positioning
- **Memory efficiency**: Constant memory usage regardless of list size

#### **JSON Lines Format Example**
```jsonl
{"uuid": "msg-1", "role": "user", "content": "Hello Claude!", "timestamp": "2024-08-06T10:00:00.000Z"}
{"uuid": "msg-2", "role": "assistant", "content": "Hello! How can I help you today?", "timestamp": "2024-08-06T10:00:15.000Z"}
{"uuid": "msg-3", "role": "tool", "tool_name": "Edit", "content": "Creating optimized component...", "timestamp": "2024-08-06T10:00:30.000Z"}
{"uuid": "msg-4", "role": "tool_result", "tool_name": "Edit", "content": "✅ Component optimized successfully", "timestamp": "2024-08-06T10:00:45.000Z"}
```

</details>

---

## 🧪 Testing

### 📊 **Testing Infrastructure** 

**Overall Quality Score: 98.7%**

```bash
# Run full test suite
npm run test:full-suite

# Individual test categories
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests  
npm run test:e2e           # End-to-end tests
npm run test:performance   # Performance benchmarks
npm run test:accessibility # Web Content Accessibility Guidelines compliance tests
```

<details>
<summary><strong>🎯 Test Coverage & Advanced Features</strong></summary>

### 🎯 **Test Coverage Breakdown**

| Test Category | Coverage | Test Count | Performance Target |
|---------------|----------|------------|-------------------|
| **Unit Tests** | 95%+ | 320 tests | <100 ms execution |
| **Integration Tests** | 90%+ | 44 tests | <500 ms per test |
| **E2E Tests** | 85%+ | 25 scenarios | <30 s full suite |
| **Performance Tests** | 100% | 18 benchmarks | 60fps animations |
| **Accessibility Tests** | 95%+ | 34 Web Content Accessibility Guidelines tests | AA compliance |

### 🧪 **Advanced Testing Features**

#### **Performance Validation**
```javascript
// Automated performance regression testing
describe('Performance Benchmarks', () => {
  it('should maintain search performance under 500ms', async () => {
    const startTime = performance.now()
    await performSearch(largeDataSet, complexQuery)
    const duration = performance.now() - startTime
    expect(duration).toBeLessThan(500)
  })
})
```

#### **Integration Testing**
```javascript
// Component interaction validation
describe('Filtering Integration', () => {
  it('should synchronize filtering state across components', async () => {
    const { filtering, navigation } = await setupIntegrationTest()
    await filtering.applyRoleFilter(['user', 'assistant'])
    expect(navigation.currentIndex.value).toBe(0) // Auto-reset navigation
  })
})
```

</details>

---

## 💻 Development

### 🛠️ **Development Setup**

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

<details>
<summary><strong>📋 Available Scripts & Development Tools</strong></summary>

### 📋 **Available Scripts**

```bash
# Development
npm run dev              # Development server (Vite)
npm run build           # Production build  
npm run preview         # Preview production build

# Testing
npm run test:full-suite # Complete testing pipeline
npm run test:unit       # Unit tests only
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # ESLint + auto-fix
npm run lint:check      # Lint without fixing
```

### 🧪 **Development Tools**

- **Vite**: Lightning-fast HMR and building
- **Vue DevTools**: Component inspection and state management
- **Vitest**: Native Vite testing with instant feedback
- **Playwright**: Cross-browser E2E testing
- **ESLint + Prettier**: Code quality and formatting

### ⚙️ **Configuration**

#### **Vite Configuration**
```javascript
// vite.config.js - Optimized for performance
export default {
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'three'],
          utils: ['highlight.js', 'marked']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'three', 'highlight.js']
  }
}
```

</details>

---

## 📚 API Reference

<details>
<summary><strong>🔧 Core Composables & Utility Classes</strong></summary>

### 🔧 **Core Composables**

#### **useMessageFiltering**
Advanced filtering system with performance optimization and error handling.

```typescript
interface MessageFiltering {
  // State
  filteredMessages: Ref<Message[]>
  searchQuery: Ref<string>
  roleFilters: Ref<Set<string>>
  toolFilters: Ref<Set<string>>
  
  // Actions
  setRoleFilter: (roles: string[]) => void
  setToolFilter: (tools: string[]) => void
  updateSearchQuery: (query: string) => void
  
  // Performance
  getPerformanceMetrics: () => PerformanceMetrics
  getFilteringStats: () => FilteringStats
  clearContentCache: () => void
  optimize: () => void
  
  // Error Handling
  errors: Readonly<Ref<FilterError[]>>
  clearErrors: () => void
}

// Usage Example
const filtering = useMessageFiltering(messages)
filtering.setRoleFilter(['user', 'assistant'])
filtering.updateSearchQuery('performance optimization')
const stats = filtering.getPerformanceMetrics()
```

#### **useNavigation**
Robust navigation with validation and health monitoring.

```typescript
interface Navigation {
  // State
  currentIndex: Ref<number>
  totalMessages: Ref<number>
  canNavigateNext: Ref<boolean>
  canNavigatePrevious: Ref<boolean>
  
  // Actions  
  goToIndex: (index: number) => boolean
  goToNext: () => boolean
  goToPrevious: () => boolean
  goToFirst: () => boolean
  goToLast: () => boolean
  
  // Validation
  validateNavigationState: () => ValidationResult
  performHealthCheck: () => HealthCheckResult
  getErrorState: () => NavigationError[]
  clearErrors: () => void
}

// Usage Example
const navigation = useNavigation(messages)
const success = navigation.goToIndex(42)
if (!success) {
  const errors = navigation.getErrorState()
  console.error('Navigation failed:', errors)
}
```

### 🛠️ **Utility Classes**

#### **MessageContentCache**
High-performance caching system for search operations.

```typescript
class MessageContentCache {
  constructor(options: CacheOptions)
  
  // Core Methods
  messageMatchesSearch(message: Message, query: string): boolean
  getStringifiedContent(message: Message): string
  invalidateCache(): void
  
  // Performance
  getStats(): CacheStats
  optimize(): void
  preWarmCache(messages: Message[]): void
  
  // Configuration
  setMaxSize(size: number): void
  enableMetrics(enabled: boolean): void
}

// Usage Example
const cache = new MessageContentCache({ maxSize: 2000 })
const matches = cache.messageMatchesSearch(message, 'search term')
const { hitRate, size } = cache.getStats()
```

#### **FilteringEngine**
Centralized filtering logic with performance optimization.

```typescript  
class FilteringEngine {
  constructor(contentCache: MessageContentCache)
  
  processMessages(
    messages: Message[],
    filters: FilterOptions
  ): FilteringResult
  
  getPerformanceMetrics(): FilteringMetrics
}

interface FilteringResult {
  filteredMessages: Message[]
  filteredToOriginalMap: Map<number, number>
  originalToFilteredMap: Map<number, number>
  stats: ProcessingStats
}
```

</details>

---

## 🤝 Contributing

We welcome contributions from everyone! Claude Log Viewer thrives on community involvement.

### 🚀 **Quick Contribution Guide**

1. **Read the Guidelines**: Check our [Contributing Guide](CONTRIBUTING.md) for detailed instructions
2. **Choose Your Contribution**:
   - 🐛 [Report bugs](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=bug_report.md)
   - ✨ [Request features](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=feature_request.md)
   - ⚡ [Report performance issues](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=performance_issue.md)
   - 🔒 [Report security issues](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=security_report.md)
3. **Submit Code**: Fork, develop, test, and create a Pull Request

### 📋 **Development Workflow**

```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/Claude-Log-View.git
cd Claude-Log-View

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and test
npm run test:full-suite
npm run lint
npm run build

# Commit and push
git commit -m 'feat: add amazing feature'
git push origin feature/amazing-feature
```

### 🎯 **Contribution Areas**

- **🐛 Bug Fixes**: Help us squash bugs and improve stability
- **✨ New Features**: Add functionality that benefits all users
- **⚡ Performance**: Optimize speed, memory usage, and user experience
- **♿ Accessibility**: Improve WCAG compliance and usability
- **📚 Documentation**: Enhance guides, examples, and API docs
- **🧪 Testing**: Increase test coverage and quality
- **🎨 UI/UX**: Improve design and user interface

### 🏆 **Recognition**

Contributors are recognized through:
- GitHub contributor statistics
- Release notes mentions
- Community discussions

For detailed guidelines, please read our [Contributing Guide](CONTRIBUTING.md).

---

## 📞 Support

Need help? We're here to support you!

### 💬 **Get Help**

- **📖 Documentation**: This README and our [comprehensive docs](docs/)
- **💭 Discussions**: [GitHub Discussions](https://github.com/zengwenliang416/Claude-Log-View/discussions) for questions and ideas
- **🐛 Bug Reports**: [Create an issue](https://github.com/zengwenliang416/Claude-Log-View/issues/new/choose) with our templates
- **💡 Feature Requests**: [Request features](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=feature_request.md)

### 📚 **Resources**

- **🚀 Performance Guide**: [PERFORMANCE_IMPROVEMENTS.md](PERFORMANCE_IMPROVEMENTS.md)
- **🧪 Testing Documentation**: [tests/TESTING_SUMMARY.md](tests/TESTING_SUMMARY.md)
- **🔒 Security Policy**: [SECURITY.md](SECURITY.md)
- **🤝 Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **📜 Changelog**: [CHANGELOG.md](CHANGELOG.md)

### 🆘 **Getting Quick Help**

1. **Search First**: Check [existing issues](https://github.com/zengwenliang416/Claude-Log-View/issues) and [discussions](https://github.com/zengwenliang416/Claude-Log-View/discussions)
2. **Use Templates**: Our issue templates help you provide the right information
3. **Be Specific**: Include browser, file size, error messages, and steps to reproduce
4. **Community Support**: Other users and maintainers are here to help

---

## 🛡️ Security

Security is a top priority for Claude Log Viewer. We take security seriously and have implemented comprehensive measures to protect our users.

### 🔐 **Security Features**

- **Local Processing**: All data stays on your device - nothing is uploaded
- **Input Validation**: Comprehensive file type and content validation
- **XSS Protection**: Content sanitization prevents script injection
- **Memory Safety**: Automatic cleanup and memory management
- **CSP Implementation**: Content Security Policy for additional protection

### 🚨 **Report Security Issues**

- **Non-Critical**: Use our [Security Report Template](https://github.com/zengwenliang416/Claude-Log-View/issues/new?template=security_report.md)
- **Critical Issues**: Contact maintainers directly (see [SECURITY.md](SECURITY.md))
- **Coordinated Disclosure**: We follow responsible disclosure practices

For detailed security information, please read our [Security Policy](SECURITY.md).

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. Our community follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

### 🤝 **Our Standards**

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and experience levels
- **Be Constructive**: Provide helpful feedback and constructive criticism
- **Be Professional**: Maintain professionalism in all interactions

### 📢 **Reporting Issues**

If you experience or witness unacceptable behavior, please report it:
- **GitHub Issues**: For non-sensitive matters
- **Direct Contact**: For serious issues requiring privacy

For more details, see our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this software in accordance with the license terms.

---

## 🙏 Acknowledgments

Claude Log Viewer exists thanks to the amazing open source community:

### 🛠️ **Core Technologies**
- **[Vue.js Team](https://vuejs.org/)** - For the excellent Vue 3 framework
- **[Vite Team](https://vitejs.dev/)** - For the lightning-fast build tool
- **[Three.js Community](https://threejs.org/)** - For stunning 3D graphics capabilities
- **[Tailwind CSS](https://tailwindcss.com/)** - For the utility-first CSS framework
- **[Highlight.js](https://highlightjs.org/)** - For beautiful syntax highlighting

### 💡 **Inspiration**
- **[Claude AI](https://claude.ai/)** - For inspiration and conversation log format
- **[GitHub](https://github.com/)** - For hosting and community features
- **[Contributor Covenant](https://www.contributor-covenant.org/)** - For community guidelines

### 👥 **Community**
- **Contributors** - Everyone who has contributed code, documentation, or feedback
- **Users** - Those who use, test, and provide valuable feedback
- **Open Source Community** - For continuous inspiration and best practices

---

<div align="center">

## 🌟 **Show Your Support**

**If Claude Log Viewer has helped you, please consider:**

⭐ **Star this repository**  
🐛 **Report issues**  
✨ **Contribute features**  
📢 **Share with others**  
💬 **Join discussions**  

---

**Made with ❤️ by the Claude Log Viewer Community**

[![Built with Vue 3](https://img.shields.io/badge/Built%20with-Vue%203-4FC08D.svg?style=flat&logo=vue.js)](https://vuejs.org/)
[![Powered by Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Styled with TailwindCSS](https://img.shields.io/badge/Styled%20with-TailwindCSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Community Driven](https://img.shields.io/badge/Community-Driven-ff69b4.svg)](https://github.com/zengwenliang416/Claude-Log-View/graphs/contributors)

**[📚 Documentation](docs/) • [🐛 Issues](https://github.com/zengwenliang416/Claude-Log-View/issues) • [💭 Discussions](https://github.com/zengwenliang416/Claude-Log-View/discussions) • [🔒 Security](SECURITY.md)**

</div>