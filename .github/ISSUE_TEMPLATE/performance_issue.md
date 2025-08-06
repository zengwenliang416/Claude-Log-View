---
name: Performance Issue
about: Report performance problems or optimization suggestions
title: '[PERF] '
labels: ['performance', 'needs-investigation']
assignees: ''
---

## Performance Issue Description
A clear and concise description of the performance problem.

## Current Behavior
Describe what currently happens:
- Loading time: [e.g. 3-4 seconds]
- UI responsiveness: [e.g. laggy scrolling]
- Memory usage: [e.g. high memory consumption]
- Other observations: [...]

## Expected Performance
Describe the expected performance:
- Target loading time: [e.g. < 1 second]
- Expected responsiveness: [e.g. smooth 60fps]
- Acceptable memory usage: [e.g. < 100MB]

## Performance Data
**Browser DevTools Metrics:**
- First Contentful Paint (FCP): [ms]
- Largest Contentful Paint (LCP): [ms]  
- First Input Delay (FID): [ms]
- Cumulative Layout Shift (CLS): [score]

**System Information:**
- Device: [e.g. MacBook Pro M1, Dell XPS]
- RAM: [e.g. 16GB]
- Browser: [e.g. Chrome 120]
- CPU usage during issue: [e.g. 80%]

## Test Case
**File Information:**
- File size: [e.g. 10MB]
- Number of messages: [e.g. ~5000]
- File format: [JSONL/JSON]

**Steps to Reproduce:**
1. Load file with [X] messages
2. Perform action [Y]
3. Observe performance issue

## Browser Console Output
```
[Paste any performance warnings or errors from console]
```

## Performance Profile
If you have browser performance profiles, please attach them or describe findings:
- Main thread blocking: [duration]
- JavaScript execution time: [breakdown]
- Rendering bottlenecks: [description]

## Suggested Improvements
If you have ideas for optimization:
- [ ] Virtual scrolling improvements
- [ ] Caching optimizations  
- [ ] Bundle size reduction
- [ ] Memory management
- [ ] Other: [describe]

## Impact Assessment
**User Experience Impact:**
- [ ] Minor annoyance
- [ ] Moderate usability issue  
- [ ] Severe performance degradation
- [ ] Application unusable

**Affected User Groups:**
- [ ] Users with large files (> 5MB)
- [ ] Users with many messages (> 1000)
- [ ] Mobile users
- [ ] Users with slower devices
- [ ] All users

## Additional Context
Add any other context about the performance issue here.