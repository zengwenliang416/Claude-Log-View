---
name: commit
description: Generate standardized git commit messages with batch commit support and smart file staging
---

Generate professional git commit messages using the git-commit-generator agent with intelligent batch commit support.

**Language Selection Parameters:**
- Chinese: `ch|c|CNS|cns` 
- English: `ENG|e|en|eng` (default)
- If no parameter provided, agent will ask user to choose

**Batch Commit Support:**
- Automatically detect multiple feature changes (user, product, order, etc.)
- Intelligently group related files by feature/module
- Support selective file staging instead of `git add .`
- Handle coupled files that need separation
- Generate separate commits for each logical feature

**Usage Examples:**
- `/commit` - Interactive mode with file selection and batch options
- `/commit ENG` - Generate English commit message with smart staging
- `/commit ch --batch` - Chinese batch commit mode
- `/commit --interactive` - Full interactive file selection mode

**Smart File Staging:**
- Analyze changed files and group by feature/module
- Show file groups to user for selection
- Avoid blind `git add .` usage
- Support fine-grained file selection
- Handle coupled files that span multiple features

**The commit message will:**
- Follow strict format: `<type>(<scope>): <emoji> <description>`
- Include appropriate emoji after colon and space
- Use present tense, imperative mood
- Keep first line under 72 characters
- Add detailed bullet-point descriptions after two blank lines
- Each detail starts with "- " prefix
- Generate both Chinese and English versions
- NO signature addition

**Batch Commit Workflow:**
1. Analyze all changed files and group by logical features
2. Present file groups to user (e.g., "User Feature", "Product Feature", "Shared Utils")
3. Allow user to select which groups to commit together or separately
4. For each selected group:
   - Stage only relevant files
   - Generate appropriate commit message
   - Ask for language preference
   - Execute commit
5. Handle remaining files or coupled files

**Interactive File Selection:**
```
Modified Files Detected:
┌─ User Feature (3 files)
│  ├── src/components/User.jsx
│  ├── src/api/userAPI.js
│  └── src/styles/user.css
├─ Product Feature (4 files)
│  ├── src/components/Product.jsx
│  ├── src/api/productAPI.js
│  ├── src/utils/productUtils.js
│  └── src/styles/product.css
└─ Shared/Coupled (2 files)
   ├── src/utils/common.js (affects both features)
   └── src/config/api.js (global config)

Options:
1. Commit User Feature only
2. Commit Product Feature only  
3. Commit both features separately (2 commits)
4. Commit all together (1 commit)
5. Custom file selection
```

**Format Structure:**
```
<type>(<scope>): <emoji> <description>


- <detailed description 1>
- <detailed description 2>
- <detailed description 3>
```

The agent will intelligently handle multi-feature scenarios and provide optimal batching strategies.