# Security Policy

## Overview

Security is a top priority for Claude Log Viewer. This document outlines our security practices, how to report vulnerabilities, and what we do to protect our users.

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| 0.x.x   | ❌ No (Development) |

## Security Features

### Client-Side Security

Claude Log Viewer operates entirely in your browser with the following security measures:

#### File Processing Security
- **Local Processing**: All log files are processed locally in your browser
- **No Data Upload**: Files never leave your device
- **Memory Cleanup**: Automatic cleanup of processed data
- **Secure Parsing**: Robust JSON/JSONL parsing with error handling

#### Input Validation
- **File Type Validation**: Strict file type and extension checking
- **File Size Limits**: Configurable size limits (default: 50MB)
- **Content Sanitization**: XSS protection for log content display
- **MIME Type Verification**: Additional security through MIME type checking

#### Content Security Policy (CSP)
- **Script Sources**: Restricted script execution sources
- **Style Sources**: Limited CSS sources to prevent injection
- **Frame Restrictions**: Prevention of clickjacking attacks
- **Object Restrictions**: Blocked unsafe object sources

### Browser Security

#### Data Isolation
- **SessionStorage**: Temporary data storage cleared on browser close
- **LocalStorage**: Limited use with automatic cleanup
- **IndexedDB**: No persistent database storage
- **Cookies**: No cookies used

#### Privacy Protection
- **No Tracking**: No analytics or tracking scripts
- **No External Calls**: No requests to external services
- **Local Fonts**: No external font loading
- **Offline Capable**: Full functionality without internet connection

## Threat Model

### In Scope
- **Malicious Log Files**: Protection against malformed or malicious JSONL/JSON files
- **XSS Attacks**: Prevention of script injection through log content
- **Memory Exhaustion**: Protection against excessively large files
- **UI Injection**: Prevention of malicious content affecting the interface

### Out of Scope
- **Browser Vulnerabilities**: Users should keep browsers updated
- **Operating System Security**: Host system security is user responsibility
- **Network Security**: Since no network requests are made
- **Physical Access**: Local device security

## Reporting a Vulnerability

### How to Report

If you discover a security vulnerability, please report it responsibly:

#### For Non-Critical Issues
- **GitHub Issues**: [Create a security issue](https://github.com/zengwenliang416/Claude-Log-View/issues/new?labels=security&template=security_report.md)
- **Public Discussion**: Use for general security questions

#### For Critical Issues
- **Private Disclosure**: Contact maintainers directly
- **Encrypted Communication**: Use GPG if available
- **Coordinated Disclosure**: Allow time for fix before public disclosure

### What to Include

Please provide the following information:

#### Vulnerability Details
- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and affected users
- **Severity**: Your assessment of severity (Critical/High/Medium/Low)
- **Reproduction**: Step-by-step reproduction instructions
- **Environment**: Browser, version, and operating system
- **Evidence**: Screenshots, logs, or proof-of-concept code

#### Example Report Format
```
## Vulnerability Summary
Brief description of the issue

## Impact
Description of potential impact

## Reproduction Steps
1. Step one
2. Step two
3. Step three

## Environment
- Browser: Chrome 119
- OS: macOS 14
- Claude Log Viewer: v1.0.0

## Additional Information
Any other relevant details
```

### Response Timeline

We commit to the following response times:

- **Initial Response**: Within 48 hours
- **Severity Assessment**: Within 1 week
- **Fix Development**: Varies by complexity
- **Public Disclosure**: After fix is available

| Severity | Initial Response | Fix Timeline | Disclosure |
|----------|------------------|--------------|------------|
| Critical | 24 hours | 1-7 days | After fix |
| High | 48 hours | 1-14 days | After fix |
| Medium | 1 week | 2-4 weeks | After fix |
| Low | 2 weeks | Next release | Immediate |

## Security Best Practices for Users

### Safe Usage
- **Updated Browser**: Use a modern, updated web browser
- **Trusted Sources**: Only process log files from trusted sources
- **File Verification**: Verify log file integrity before processing
- **Regular Updates**: Keep Claude Log Viewer updated to the latest version

### File Handling
- **Source Verification**: Ensure log files come from legitimate Claude sessions
- **Size Awareness**: Be cautious with extremely large files
- **Content Review**: Review file content if received from untrusted sources
- **Backup Important Data**: Keep backups of important log files

### Browser Security
- **Enable Security Features**: Use browser security features
- **Extensions**: Be cautious with browser extensions that might interfere
- **Incognito Mode**: Consider using for sensitive log files
- **Clear Data**: Clear browser data after processing sensitive files

## Security Architecture

### Defense in Depth

Our security approach uses multiple layers:

#### Layer 1: Input Validation
```javascript
// File type and extension validation
const allowedTypes = ['.jsonl', '.json']
const allowedMimeTypes = ['application/json', 'text/plain']

// Size validation
const maxFileSize = 50 * 1024 * 1024 // 50MB

// Content structure validation
function validateLogStructure(content) {
  // Validate JSON structure and required fields
}
```

#### Layer 2: Content Sanitization
```javascript
// XSS prevention for log content display
function sanitizeContent(content) {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['code', 'pre', 'strong', 'em'],
    ALLOWED_ATTR: ['class']
  })
}
```

#### Layer 3: Memory Management
```javascript
// Automatic cleanup and memory management
class MemoryManager {
  cleanup() {
    // Clear caches, remove references, trigger GC
  }
}
```

#### Layer 4: Error Handling
```javascript
// Secure error handling that doesn't leak information
function handleError(error) {
  logger.error('Processing failed', { 
    type: error.constructor.name,
    // No sensitive data in logs
  })
}
```

## Vulnerability Response Process

### Internal Process

1. **Receipt**: Acknowledge vulnerability report
2. **Assessment**: Evaluate severity and impact
3. **Reproduction**: Confirm vulnerability exists
4. **Fix Development**: Develop and test fix
5. **Testing**: Comprehensive security testing
6. **Release**: Deploy fix to users
7. **Disclosure**: Public disclosure after fix

### Communication

- **Security Advisories**: Posted to GitHub Security Advisories
- **Release Notes**: Security fixes mentioned in release notes
- **User Notification**: Critical issues communicated to users
- **Community Update**: Summary of resolved issues

## Compliance and Standards

### Web Security Standards
- **OWASP Guidelines**: Following OWASP best practices
- **CSP Implementation**: Content Security Policy enforcement
- **SRI**: Subresource Integrity for external resources
- **HTTPS**: Recommended for hosting deployments

### Privacy Standards
- **No Data Collection**: No personal data collection
- **Local Processing**: All data stays on user's device
- **No Tracking**: No user behavior tracking
- **Minimal Permissions**: Request only necessary browser permissions

## Security Testing

### Automated Testing
- **SAST**: Static Application Security Testing in CI/CD
- **Dependency Scanning**: Regular dependency vulnerability scanning
- **Code Quality**: Security-focused code quality checks
- **Penetration Testing**: Automated security testing

### Manual Testing
- **Code Review**: Security-focused code reviews
- **Threat Modeling**: Regular threat model reviews
- **Penetration Testing**: Professional security assessments
- **Vulnerability Research**: Ongoing security research

## Incident Response

### In Case of Security Incident

1. **Immediate Response**
   - Assess scope and impact
   - Implement temporary mitigations
   - Document incident details

2. **Investigation**
   - Root cause analysis
   - Affected user identification
   - Timeline reconstruction

3. **Resolution**
   - Develop permanent fix
   - Test fix thoroughly
   - Deploy fix to users

4. **Communication**
   - User notification
   - Public disclosure
   - Lessons learned documentation

## Contact Information

### Security Team
- **GitHub Issues**: [Security Issues](https://github.com/zengwenliang416/Claude-Log-View/issues?q=label%3Asecurity)
- **GitHub Security**: [Security Advisories](https://github.com/zengwenliang416/Claude-Log-View/security)
- **Community**: [GitHub Discussions](https://github.com/zengwenliang416/Claude-Log-View/discussions)

### Emergency Contact
For critical security issues requiring immediate attention, please create a private GitHub issue with the security label.

## Acknowledgments

We thank the security research community for their efforts in making Claude Log Viewer more secure. Security researchers who responsibly disclose vulnerabilities will be acknowledged in our security advisories (with their permission).

### Hall of Fame
*Security researchers who have helped improve Claude Log Viewer will be listed here.*

---

**Security is everyone's responsibility. Thank you for helping keep Claude Log Viewer secure!**

Last updated: December 2024