# Contributing to Claude Log Viewer

Thank you for your interest in contributing to Claude Log Viewer! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Performance Requirements](#performance-requirements)
- [Accessibility Standards](#accessibility-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 7.x or higher
- **Git** for version control

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Claude-Log-View.git
   cd Claude-Log-View
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm run test:full-suite
   ```

### Project Structure

```
src/
├── components/           # Vue components
│   ├── common/          # Shared components
│   ├── ui/              # UI component library
│   ├── Sidebar/         # Navigation and filtering
│   └── MainContent/     # Message display
├── composables/         # Vue 3 Composition API
├── utils/               # Core utilities and services
└── assets/             # Styles and resources
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `fix/issue-name` - Bug fixes
- `perf/optimization-name` - Performance improvements

### Commit Messages

Follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>(<scope>): <emoji> <description>

<body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Testing improvements
- `build`: Build system changes
- `ci`: CI/CD changes

**Examples:**
```bash
feat(filtering): ✨ add tool-specific message filtering
fix(performance): 🐛 resolve memory leak in MessageContentCache
docs(readme): 📚 update installation instructions
```

## Code Standards

### Code Style

- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Automatic code formatting
- **Vue Style Guide**: Follow [Vue.js Style Guide](https://vuejs.org/style-guide/)

### TypeScript Guidelines

- Use TypeScript-style patterns even in JavaScript files
- Provide clear interface definitions for complex objects
- Document function signatures and return types

### Component Guidelines

1. **Composition API**: Use Vue 3 Composition API exclusively
2. **Single Responsibility**: Each component should have a clear, single purpose
3. **Props Validation**: Always validate component props
4. **Accessibility**: Include ARIA attributes and semantic HTML

### Performance Standards

- **Bundle Size**: Contributions should not increase bundle size by > 5%
- **Loading Time**: New features must not significantly impact load time
- **Memory Usage**: Implement proper cleanup and memory management
- **Cache Efficiency**: Maintain > 85% cache hit rate for MessageContentCache

## Testing Guidelines

### Test Coverage Requirements

- **Unit Tests**: > 95% coverage for new code
- **Integration Tests**: Cover component interactions
- **E2E Tests**: Cover critical user workflows
- **Performance Tests**: Validate performance requirements
- **Accessibility Tests**: Ensure WCAG 2.1 AA compliance

### Test Structure

```javascript
describe('ComponentName', () => {
  describe('feature group', () => {
    it('should behave correctly when condition', () => {
      // Arrange
      const setup = createTestSetup()
      
      // Act  
      const result = performAction(setup)
      
      // Assert
      expect(result).toBe(expectedValue)
    })
  })
})
```

### Running Tests

```bash
# Full test suite
npm run test:full-suite

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:accessibility
```

## Performance Requirements

### Benchmarks to Maintain

- **Search Performance**: < 500ms for 1000+ messages
- **Initial Load**: < 2s for typical files (< 5MB)
- **Memory Usage**: < 100MB for large files (10MB+)
- **Cache Hit Rate**: > 70% for MessageContentCache
- **Frame Rate**: 60fps for animations and scrolling

### Optimization Guidelines

1. **Lazy Loading**: Implement for non-critical components
2. **Virtual Scrolling**: Use for large lists
3. **Debouncing**: Apply to user input handlers
4. **Memoization**: Cache expensive computations
5. **Bundle Splitting**: Code-split large features

## Accessibility Standards

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and structure
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Indicators**: Clear and visible focus states
- **Semantic HTML**: Use appropriate HTML elements

### Testing Accessibility

```bash
# Run accessibility tests
npm run test:accessibility

# Manual testing with screen readers
# - NVDA (Windows)
# - JAWS (Windows)  
# - VoiceOver (macOS)
# - Orca (Linux)
```

## Pull Request Process

### Before Submitting

1. **Run Quality Checks**
   ```bash
   npm run lint
   npm run test:full-suite
   npm run build
   ```

2. **Update Documentation**
   - Update README if needed
   - Add/update code comments
   - Update API documentation

3. **Performance Testing**
   - Run performance benchmarks
   - Verify no regressions
   - Test with large files

### PR Requirements

- [ ] **Description**: Clear description of changes
- [ ] **Tests**: Comprehensive test coverage
- [ ] **Documentation**: Updated as needed
- [ ] **Performance**: No significant performance impact
- [ ] **Accessibility**: WCAG 2.1 AA maintained
- [ ] **Browser Testing**: Tested in major browsers
- [ ] **Mobile Testing**: Responsive design verified

### Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one maintainer approval
3. **Quality Gate**: Performance and accessibility verified
4. **Manual Testing**: Feature tested by reviewer

## Issue Reporting

### Bug Reports

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear reproduction steps
- Expected vs actual behavior
- Environment information
- Log files and console errors
- Performance impact assessment

### Feature Requests

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) and include:

- Use case description
- Proposed solution
- Alternative approaches considered
- Implementation complexity estimate

### Performance Issues

Use the [Performance Issue Template](.github/ISSUE_TEMPLATE/performance_issue.md) and include:

- Performance metrics
- Browser DevTools data
- System specifications
- Test file characteristics

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussions and questions
- **Pull Requests**: Code contributions and reviews

### Getting Help

1. **Documentation**: Check README and inline documentation
2. **Search Issues**: Look for existing solutions
3. **GitHub Discussions**: Ask questions
4. **Create Issue**: Report bugs or request features

### Recognition

Contributors are recognized in:
- GitHub contributor statistics
- Release notes for significant contributions
- README acknowledgments for major features

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Breaking changes increment MAJOR
- New features increment MINOR  
- Bug fixes increment PATCH

### Release Workflow

1. **Feature Freeze**: No new features in release branch
2. **Testing**: Comprehensive testing and QA
3. **Documentation**: Update changelog and documentation
4. **Release**: Tag and publish release
5. **Post-Release**: Monitor for issues

## Thank You!

Your contributions make Claude Log Viewer better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping other users, your efforts are greatly appreciated!

For questions about contributing, please open a [GitHub Discussion](https://github.com/zengwenliang416/Claude-Log-View/discussions) or contact the maintainers.

---

**Happy Contributing!** 🚀