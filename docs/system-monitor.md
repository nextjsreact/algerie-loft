# System Monitoring & Crash Audit Log

## Purpose
This file tracks potential blocking situations and audit points where system crashes or failures might occur.

## Blocking Situations to Monitor

### 1. Resource Exhaustion
- **Memory Usage**: Monitor when memory consumption exceeds 80%
- **Disk Space**: Alert when available disk space < 1GB
- **CPU Usage**: Track sustained CPU usage > 90% for 5+ minutes
- **Network Timeouts**: Monitor connection timeouts > 30 seconds

### 2. File System Issues
- **Permission Errors**: Track file/directory access denials
- **Lock Conflicts**: Monitor file locking conflicts
- **Path Length**: Windows path length limitations (260 chars)
- **Invalid Characters**: Special characters in file names

### 3. Process Dependencies
- **Service Dependencies**: Required services not running
- **Port Conflicts**: Required ports already in use
- **Environment Variables**: Missing or incorrect env vars
- **External Tool Availability**: Required CLI tools not found

### 4. Code Execution Blocks
- **Infinite Loops**: Detect long-running operations without progress
- **Deadlocks**: Monitor thread/process deadlocks
- **Stack Overflow**: Deep recursion detection
- **Memory Leaks**: Gradual memory increase without release

## Crash Audit Points

### Pre-Execution Checks
```
[ ] Validate input parameters
[ ] Check system resources
[ ] Verify dependencies
[ ] Test network connectivity
[ ] Confirm file permissions
```

### During Execution Monitoring
```
[ ] Progress indicators active
[ ] Resource usage within limits
[ ] Error handling triggered appropriately
[ ] Timeout mechanisms working
[ ] Graceful degradation available
```

### Post-Execution Validation
```
[ ] Expected outputs generated
[ ] Resources properly released
[ ] Temporary files cleaned up
[ ] State consistency maintained
[ ] Error logs captured
```

## Common Crash Scenarios

### 1. Windows-Specific Issues
- **Path separators**: Using `/` instead of `\`
- **Case sensitivity**: File name case mismatches
- **Reserved names**: CON, PRN, AUX, NUL conflicts
- **Admin privileges**: Operations requiring elevation

### 2. Tool Integration Failures
- **Command not found**: CLI tools not in PATH
- **Version mismatches**: Incompatible tool versions
- **Configuration errors**: Invalid config files
- **Authentication failures**: Missing credentials

### 3. Data Processing Issues
- **Large file handling**: Files exceeding memory limits
- **Character encoding**: UTF-8/ASCII conversion errors
- **Malformed input**: Invalid JSON, XML, or data formats
- **Concurrent access**: Multiple processes accessing same resource

## Monitoring Implementation

### Log Entry Format
```
[TIMESTAMP] [LEVEL] [COMPONENT] [MESSAGE]
[CONTEXT] Additional details
[ACTION] What was attempted
[RESULT] Success/Failure/Partial
```

### Alert Thresholds
- **Critical**: System crash imminent
- **Warning**: Potential blocking situation
- **Info**: Normal operation checkpoint
- **Debug**: Detailed execution trace

## Recovery Strategies

### Automatic Recovery
1. **Retry Logic**: Exponential backoff for transient failures
2. **Fallback Options**: Alternative execution paths
3. **Resource Cleanup**: Automatic cleanup on failure
4. **State Restoration**: Rollback to last known good state

### Manual Intervention Points
1. **User Confirmation**: Before destructive operations
2. **Alternative Paths**: When primary method fails
3. **Resource Allocation**: When limits are reached
4. **Configuration Updates**: When settings need adjustment

---

## Usage Instructions

1. **Before Operations**: Check relevant monitoring points
2. **During Operations**: Log progress and resource usage
3. **After Operations**: Validate completion and cleanup
4. **On Failures**: Document failure mode and recovery actions

## Maintenance

- Review and update monitoring points monthly
- Analyze crash patterns for prevention
- Update thresholds based on system performance
- Document new failure modes as discovered