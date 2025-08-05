# Implementation Tasks: Pagination and Filtering Bug Fixes

## Phase 1: Fix Default State and Empty Filter Behavior

### 1. Fix useMessageFiltering Default State Logic
- [ ] Modify `useMessageFiltering.js` composable to show all messages by default
  - Update `filteredMessages` computed property to return all messages when no filters are active
  - Add `hasActiveFilters` computed property to determine if any filters are applied
  - Ensure empty Set filters and empty search query result in showing all messages
  - References: Requirements 1, 2

### 2. Update Filter Logic to Handle "Show All" State
- [ ] Enhance filter application logic in `useMessageFiltering.js`
  - Modify role filter logic to skip filtering when `roleFilters.size === 0`
  - Modify tool filter logic to skip filtering when `toolFilters.size === 0`
  - Update search filter to skip when `searchQuery` is empty or whitespace-only
  - Add unit tests for default state behavior
  - References: Requirements 1, 2

### 3. Fix FilterControls Clear All Functionality
- [ ] Update `FilterControls.vue` clear all filters implementation
  - Verify `clearAllFilters` method properly empties all filter sets
  - Ensure search query is cleared to empty string
  - Test that UI checkboxes are unchecked after clearing
  - Verify message counts are recalculated correctly
  - References: Requirements 2, 7

## Phase 2: Implement Index Mapping System

### 4. Add Index Mapping to useMessageFiltering
- [ ] Extend `useMessageFiltering.js` with index mapping capabilities
  - Add `filteredToOriginalIndexMap` computed property as Map<number, number>
  - Add `originalToFilteredIndexMap` computed property as Map<number, number>
  - Implement `getOriginalIndex(filteredIndex)` method
  - Implement `getFilteredIndex(originalIndex)` method
  - Generate mappings when filtered messages change
  - References: Requirements 4, 6

### 5. Create Navigation State Synchronization
- [ ] Enhance `useNavigation.js` to handle filtered message changes
  - Add watcher for messages array changes to detect filter updates
  - Implement `syncNavigationState()` method to correct invalid states
  - Add logic to map current index between filtered/original arrays
  - Handle case where current message is filtered out
  - Add `isValidNavigationState()` validation method
  - References: Requirements 4, 6

### 6. Update LogViewer Integration
- [ ] Modify `LogViewer.vue` to use enhanced navigation synchronization
  - Pass index mapping methods to navigation composable
  - Ensure navigation composable receives filter change notifications
  - Add error handling for invalid navigation states
  - Test integration between filtering and navigation systems
  - References: Requirements 4, 6

## Phase 3: Fix Navigation State Consistency

### 7. Update NavigationControls Position Display
- [ ] Fix `NavigationControls.vue` to show accurate position information
  - Update position calculation to use filtered message count
  - Ensure "current/total" reflects filtered results, not original count
  - Handle edge case when no messages match filters
  - Test button enable/disable states with various filter conditions
  - References: Requirements 4, 5

### 8. Implement Navigation State Correction
- [ ] Add automatic state correction to `useNavigation.js`
  - Detect when current index exceeds filtered message count
  - Automatically navigate to last valid message when out of bounds
  - Handle transition to empty filtered results gracefully
  - Preserve current message when possible during filter changes
  - Add logging for navigation state corrections
  - References: Requirements 6

### 9. Fix MessageList Current Selection
- [ ] Update `MessageList.vue` to handle filtered message selection
  - Ensure clicked message index maps correctly to navigation state
  - Update active message highlighting for filtered results
  - Handle scroll-to-current for filtered message lists
  - Test message selection with various filter combinations
  - References: Requirements 5

## Phase 4: Fix Message Count Accuracy

### 10. Implement Accurate Filter Counts
- [ ] Update `FilterControls.vue` to display correct message counts
  - Replace placeholder `getRoleCount()` with actual count calculation
  - Replace placeholder `getToolCount()` with actual count calculation  
  - Pass message count data from parent component
  - Ensure counts update when messages array changes
  - Handle zero counts gracefully in UI
  - References: Requirements 7

### 11. Add Count Calculation to useMessageFiltering
- [ ] Extend `useMessageFiltering.js` with count calculation methods
  - Add `getRoleMessageCount(role)` method
  - Add `getToolMessageCount(tool)` method
  - Return count data from composable for use in FilterControls
  - Optimize count calculations for performance
  - Add caching for count results when messages don't change
  - References: Requirements 7

### 12. Update MessageIndex Component Integration
- [ ] Modify `MessageIndex.vue` to pass count data to FilterControls
  - Receive count data from parent LogViewer component
  - Pass role and tool counts as props to FilterControls
  - Ensure counts are reactive to message changes
  - Test count accuracy with different log files
  - References: Requirements 7

## Phase 5: Testing and Validation

### 13. Create Unit Tests for Enhanced Filtering
- [ ] Write comprehensive unit tests for `useMessageFiltering.js`
  - Test default state returns all messages
  - Test individual filter types work correctly
  - Test filter combinations and interactions
  - Test index mapping accuracy
  - Test search functionality with filtering
  - Verify edge cases like empty message arrays

### 14. Create Integration Tests for Navigation
- [ ] Write integration tests for navigation-filtering interaction
  - Test navigation after applying various filters
  - Test current message preservation during filter changes
  - Test navigation state correction scenarios
  - Test keyboard navigation with filtered results
  - Verify position display accuracy

### 15. Create End-to-End User Workflow Tests
- [ ] Write E2E tests for complete user workflows
  - Test log file loading shows all messages by default
  - Test applying filters updates navigation correctly
  - Test clearing filters returns to show all state
  - Test "no messages match" scenarios
  - Test large log file performance with filters

## Phase 6: Performance Optimization and Polish

### 16. Optimize Filter Performance
- [ ] Review and optimize filtering performance
  - Profile filter application with large message sets
  - Optimize Set operations and array filtering
  - Add debouncing for rapid filter changes
  - Cache expensive computations where possible
  - Measure and document performance improvements

### 17. Add Error Handling and Edge Cases
- [ ] Implement robust error handling
  - Handle malformed message data gracefully
  - Add fallback states for navigation errors
  - Provide user feedback for error conditions
  - Test with various log file formats and sizes
  - Document known limitations and workarounds

### 18. Final Integration and User Testing
- [ ] Complete integration testing and user validation
  - Test all requirements against implementation
  - Verify no regressions in existing functionality
  - Conduct user acceptance testing with sample log files
  - Document any remaining issues or limitations
  - Prepare deployment and rollback procedures

## Success Validation Tasks

### 19. Verify Requirements Compliance
- [ ] Validate each requirement has been fully implemented
  - Requirement 1: Default message display ✓
  - Requirement 2: "Show all" filter functionality ✓  
  - Requirement 3: Proper pagination after log import ✓
  - Requirement 4: Filter-navigation synchronization ✓
  - Requirement 5: Message list visibility ✓
  - Requirement 6: Navigation state consistency ✓
  - Requirement 7: Filter count accuracy ✓
  - Requirement 8: Performance and user experience ✓

### 20. Performance and Quality Assurance
- [ ] Conduct final performance and quality validation
  - Measure filter application response times
  - Verify memory usage remains stable
  - Test with various log file sizes
  - Validate user experience improvements
  - Document performance characteristics