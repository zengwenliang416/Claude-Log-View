# Claude Log Viewer

A Vue 3 web application for parsing and visualizing Claude Code conversation logs in JSONL format.

## Features

- **JSONL Log Parsing**: Parse and display Claude Code conversation logs beautifully
- **Message Filtering**: Filter messages by role (User, Assistant, Tool, Tool Result) and tool type
- **Navigation**: Navigate through messages with pagination and keyboard shortcuts
- **Syntax Highlighting**: Code content with syntax highlighting for multiple languages
- **Dark Theme**: Modern dark theme UI designed for comfortable viewing
- **Responsive Design**: Works on desktop and mobile devices
- **File Loading**: Drag-and-drop or click to load JSONL files

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

Build the application for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Load a Log File**: Click the "Load Chat Log" button or drag and drop a `.jsonl` file onto the application
2. **Filter Messages**: Use the sidebar filters to show only specific message types or tools
3. **Navigate**: Use the navigation controls or arrow keys to move between messages
4. **View Content**: Message content is displayed with syntax highlighting and proper formatting

### Supported File Formats

- `.jsonl` (JSON Lines) - Primary format
- `.json` - Single JSON objects (limited support)

### File Size Limits

- Maximum file size: 50MB
- Large files are parsed efficiently with streaming

## Architecture

The application is built with:

- **Vue 3**: Using Composition API for reactive state management
- **Vite**: Fast build tool and development server  
- **Scoped CSS**: Component-isolated styling to prevent conflicts
- **Highlight.js**: Syntax highlighting for code content
- **Composables**: Reusable logic for parsing, filtering, and navigation

### Project Structure

```
src/
├── components/
│   ├── LogViewer.vue           # Main application component
│   ├── Sidebar/                # Left sidebar components
│   │   ├── MessageIndex.vue    # Container component
│   │   ├── FilterControls.vue  # Role and tool filters
│   │   ├── NavigationControls.vue # Pagination controls
│   │   └── MessageList.vue     # Message list display
│   ├── MainContent/            # Main content area
│   │   ├── MessageDisplay.vue  # Content container
│   │   ├── MessageHeader.vue   # Message metadata
│   │   └── MessageContent.vue  # Formatted content
│   └── common/                 # Shared components
│       ├── FileUpload.vue      # File loading
│       ├── LoadingSpinner.vue  # Loading indicator
│       └── ErrorMessage.vue    # Error display
├── composables/                # Vue composables
│   ├── useLogParser.js         # File parsing logic
│   ├── useMessageFiltering.js  # Filtering logic
│   ├── useNavigation.js        # Navigation logic
│   └── useSyntaxHighlighting.js # Code highlighting
├── utils/                      # Utility functions
│   ├── logParser.js            # JSONL parsing
│   ├── messageTypes.js         # Message type handling
│   └── dateFormatter.js        # Date formatting
└── assets/
    └── styles/                 # CSS files
        ├── variables.css       # CSS custom properties
        ├── reset.css           # CSS reset
        └── highlight.css       # Syntax highlighting
```

## Message Types

The application recognizes several message types from Claude Code logs:

- **User**: Messages from the user
- **Assistant**: Responses from Claude
- **Tool**: Tool usage by Claude (Bash, Edit, Read, etc.)
- **Tool Result**: Results from tool execution
- **Summary**: Conversation summaries

## Keyboard Shortcuts

- **Arrow Keys**: Navigate between messages
- **Home**: Go to first message  
- **End**: Go to last message

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Code Style

The project uses:
- ESLint for JavaScript linting
- Scoped CSS for component styling
- Vue 3 Composition API patterns

### Component Guidelines

- Use `<style scoped>` for component-specific styles
- Implement proper prop validation and TypeScript-style comments
- Follow Vue 3 Composition API best practices
- Ensure responsive design and accessibility

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style and patterns
- Components use scoped styling
- New features include appropriate error handling
- Changes are tested with sample log files