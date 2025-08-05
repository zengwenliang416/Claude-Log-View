---
name: commit
description: Generate standardized git commit messages with emojis based on code changes
---

Generate a professional git commit message using the git-commit-generator agent. The commit message will:

- Follow conventional commit format: `<type>(<scope>): <description>`
- Include appropriate emoji prefix based on change type
- Use present tense, imperative mood
- Keep first line under 50 characters when possible
- Include multi-line format with body text for complex changes
- Add signature: `🤖 Generated with [Wenliang_Zeng](https://github.com/zengwenliang416)`

Analyze the current git changes and generate an appropriate commit message.