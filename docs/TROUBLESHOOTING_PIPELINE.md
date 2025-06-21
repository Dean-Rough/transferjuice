# Pipeline Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting procedures for the Transfer Juice data processing pipeline. The system is designed for reliability, but when issues occur, this guide will help you diagnose and resolve them quickly.

## Quick Diagnostic Commands

### Pipeline Health Check
```bash
# Check overall pipeline health
curl http://localhost:3000/api/health

# Check specific components
curl http://localhost:3000/api/health/database
curl http://localhost:3000/api/health/ai
curl http://localhost:3000/api/health/twitter
curl http://localhost:3000/api/health/websocket
```

### Service Status Verification
```bash
# Check recent pipeline executions
npm run pipeline:status

# View pipeline logs
npm run logs:pipeline

# Check quality validation results
npm run quality:report

# Monitor real-time metrics
npm run monitoring:dashboard
```

## Common Issues & Solutions

### 1. Pipeline Execution Failures

#### Issue: Hourly monitor not executing
**Symptoms:**
- No new feed items appearing
- Last pipeline execution timestamp is old
- Cron job logs show failures

**Diagnosis:**
```bash
# Check cron job status
curl http://localhost:3000/api/cron/hourly

# View execution logs
tail -f logs/pipeline.log | grep "hourly monitor"

# Check system resources
npm run system:health
```

**Solutions:**
1. **Restart the cron service:**
   ```bash
   npm run pipeline:restart
   ```

2. **Check environment variables:**
   ```bash
   # Verify configuration
   npm run config:validate
   ```

3. **Manual pipeline execution:**
   ```bash
   # Run pipeline manually
   npm run pipeline:execute
   ```

#### Issue: Processing timeout errors
**Symptoms:**
- Pipeline execution exceeds 10 seconds
- Timeout errors in logs
- Incomplete content processing

**Diagnosis:**
```typescript
// Check processing time metrics
const metrics = await getPipelineMetrics();
console.log('Average processing time:', metrics.averageProcessingTime);
console.log('Timeout rate:', metrics.timeoutRate);
```

**Solutions:**
1. **Increase timeout threshold:**
   ```bash
   export PROCESSING_TIMEOUT="15000"  # 15 seconds
   ```

2. **Optimize AI processing:**
   ```typescript
   // Reduce batch size in config/pipeline.ts
   processing: {
     batchSize: 5, // Reduce from 10
     maxConcurrency: 3, // Reduce from 5
   }
   ```

3. **Enable caching:**
   ```typescript
   // Ensure caching is enabled
   performance: {
     cacheEnabled: true,
     cacheTTL: 3600,
   }
   ```

### 2. AI Processing Issues

#### Issue: OpenAI API failures
**Symptoms:**
- AI classification errors
- Terry commentary generation fails
- Quality validation errors

**Diagnosis:**
```bash
# Test OpenAI connection
npm run ai:test

# Check API rate limits
npm run ai:limits

# View AI processing logs
tail -f logs/ai.log
```

**Solutions:**
1. **Verify API key:**
   ```bash
   # Check API key format
   echo $OPENAI_API_KEY | grep "^sk-"
   ```

2. **Handle rate limits:**
   ```typescript
   // Implement exponential backoff
   const retryWithBackoff = async (fn, retries = 3) => {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
       }
     }
   };
   ```

3. **Use fallback responses:**
   ```typescript
   // Implement cached fallbacks
   if (aiResponse.failed) {
     return getCachedTerryResponse(contentType);
   }
   ```

#### Issue: Quality validation failures
**Symptoms:**
- High content rejection rate
- Terry voice consistency below threshold
- Factual accuracy concerns

**Diagnosis:**
```typescript
// Check quality metrics
const qualityReport = await getQualityMetrics();
console.log('Pass rate:', qualityReport.passRate);
console.log('Terry score average:', qualityReport.averageTerryScore);
console.log('Common failure reasons:', qualityReport.failureReasons);
```

**Solutions:**
1. **Adjust quality thresholds:**
   ```bash
   # Temporary threshold reduction
   export TERRY_VOICE_THRESHOLD="0.85"
   export QUALITY_VALIDATION_THRESHOLD="0.80"
   ```

2. **Improve AI prompts:**
   ```typescript
   // Enhance prompts in config/pipeline.ts
   prompts: {
     terry: {
       systemPrompt: "Enhanced prompt with more specific instructions...",
       voiceConsistencyThreshold: 0.85,
     }
   }
   ```

3. **Manual review queue:**
   ```bash
   # Process review queue
   npm run quality:review
   ```

### 3. Database Issues

#### Issue: Connection failures
**Symptoms:**
- Database connection timeouts
- Query execution failures
- Data not persisting

**Diagnosis:**
```bash
# Test database connection
npm run db:test

# Check connection pool status
npm run db:pool-status

# View slow queries
npm run db:slow-queries
```

**Solutions:**
1. **Restart database connections:**
   ```bash
   npm run db:reconnect
   ```

2. **Optimize connection pooling:**
   ```typescript
   // Adjust pool settings in config/pipeline.ts
   database: {
     pooling: {
       maxConnections: 10, // Reduce if needed
       connectionTimeout: 15000, // Increase timeout
     }
   }
   ```

3. **Check Neon database status:**
   ```bash
   # Verify Neon service availability
   curl https://status.neon.tech/api/v2/status.json
   ```

#### Issue: Slow query performance
**Symptoms:**
- Queries taking >1 second
- Feed loading delays
- Dashboard timeouts

**Diagnosis:**
```sql
-- Check for missing indexes
EXPLAIN ANALYZE SELECT * FROM feed_items 
WHERE published_at > NOW() - INTERVAL '24 hours' 
ORDER BY published_at DESC;

-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Solutions:**
1. **Add missing indexes:**
   ```sql
   CREATE INDEX CONCURRENTLY idx_feed_items_published_priority 
   ON feed_items(published_at, priority);
   ```

2. **Optimize queries:**
   ```typescript
   // Use proper pagination
   const items = await prisma.feedItem.findMany({
     take: 20,
     skip: page * 20,
     orderBy: { publishedAt: 'desc' },
   });
   ```

3. **Enable query caching:**
   ```typescript
   // Use Redis for query caching
   const cached = await redis.get(`feed:${cacheKey}`);
   if (cached) return JSON.parse(cached);
   ```

### 4. Twitter API Issues

#### Issue: Rate limit exceeded
**Symptoms:**
- Twitter API 429 errors
- Source monitoring failures
- Incomplete tweet fetching

**Diagnosis:**
```bash
# Check rate limit status
npm run twitter:rate-limits

# View Twitter API logs
tail -f logs/twitter.log | grep "rate limit"
```

**Solutions:**
1. **Implement rate limit handling:**
   ```typescript
   // Respect rate limit headers
   const rateLimitRemaining = response.headers['x-rate-limit-remaining'];
   const rateLimitReset = response.headers['x-rate-limit-reset'];
   
   if (rateLimitRemaining < 10) {
     const resetTime = new Date(rateLimitReset * 1000);
     const waitTime = resetTime.getTime() - Date.now();
     await new Promise(resolve => setTimeout(resolve, waitTime));
   }
   ```

2. **Distribute API calls:**
   ```typescript
   // Spread source checking over the hour
   const sources = getAllSources();
   const delayBetweenSources = 3600000 / sources.length; // 1 hour / number of sources
   
   for (const source of sources) {
     await checkSource(source);
     await new Promise(resolve => setTimeout(resolve, delayBetweenSources));
   }
   ```

3. **Use Twitter API v2 efficiently:**
   ```typescript
   // Optimize API requests
   const tweets = await client.tweets.tweetsRecentSearch({
     query: optimizedQuery,
     max_results: 100, // Maximum allowed
     'tweet.fields': ['created_at', 'author_id', 'public_metrics'],
   });
   ```

#### Issue: Authentication failures
**Symptoms:**
- 401 Unauthorized errors
- Bearer token rejection
- API access denied

**Solutions:**
1. **Verify bearer token:**
   ```bash
   # Test token validity
   curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
        "https://api.twitter.com/2/tweets/search/recent?query=test"
   ```

2. **Regenerate credentials:**
   - Visit Twitter Developer Portal
   - Regenerate bearer token
   - Update environment variables

### 5. Real-time Updates Issues

#### Issue: WebSocket connection failures
**Symptoms:**
- Live updates not appearing
- Connection drops frequently
- High reconnection rate

**Diagnosis:**
```bash
# Check WebSocket server status
npm run websocket:status

# Monitor connection count
npm run websocket:connections

# View WebSocket logs
tail -f logs/websocket.log
```

**Solutions:**
1. **Restart WebSocket server:**
   ```bash
   npm run websocket:restart
   ```

2. **Optimize connection handling:**
   ```typescript
   // Implement connection pooling
   const wsServer = new WebSocketServer({
     port: 3001,
     perMessageDeflate: true,
     maxConnections: 10000,
   });
   
   // Add heartbeat
   setInterval(() => {
     wsServer.clients.forEach(ws => {
       if (ws.readyState === WebSocket.OPEN) {
         ws.ping();
       }
     });
   }, 30000);
   ```

3. **Implement fallback to polling:**
   ```typescript
   // Client-side fallback
   if (websocketFailed) {
     setInterval(() => {
       fetchLatestUpdates();
     }, 5000); // Poll every 5 seconds
   }
   ```

### 6. Content Mixing Issues

#### Issue: Partner content not appearing
**Symptoms:**
- Feed goes quiet during ITK lulls
- No partner content integration
- Quiet period detection not working

**Diagnosis:**
```bash
# Check content mixing status
npm run content:mixing-status

# View partner content logs
tail -f logs/content-mixing.log
```

**Solutions:**
1. **Verify partner RSS feeds:**
   ```bash
   # Test RSS feed availability
   curl -I https://theupshot.com/rss
   curl -I https://www.fourfourtwo.com/rss
   ```

2. **Check quiet period detection:**
   ```typescript
   // Debug quiet period logic
   const recentUpdates = await getRecentITKUpdates(2); // Last 2 hours
   console.log('Recent updates:', recentUpdates.length);
   console.log('Quiet threshold:', CONFIG.contentMixing.quietPeriodThreshold);
   ```

3. **Manual content mixing trigger:**
   ```bash
   # Force content mixing
   npm run content:mix-now
   ```

## Performance Optimization

### Memory Usage Issues
```bash
# Monitor memory usage
npm run memory:monitor

# Garbage collection
node --expose-gc server.js

# Memory profiling
npm run memory:profile
```

### CPU Usage Issues
```bash
# CPU profiling
npm run cpu:profile

# Identify bottlenecks
npm run performance:analyze
```

### Cache Optimization
```bash
# Cache hit rate monitoring
npm run cache:stats

# Clear cache if needed
npm run cache:clear

# Optimize cache TTL
npm run cache:optimize
```

## Monitoring & Alerting

### Setting Up Alerts
```typescript
// Custom alert configuration
const alertConfig = {
  pipelineFailure: {
    threshold: 0.01, // 1% failure rate
    action: 'email',
    recipients: ['admin@transferjuice.com'],
  },
  qualityDegradation: {
    threshold: 0.80, // 80% content passing
    action: 'slack',
    channel: '#alerts',
  },
};
```

### Log Analysis
```bash
# Error pattern analysis
grep "ERROR" logs/*.log | tail -100

# Performance metrics
grep "processing_time" logs/pipeline.log | awk '{sum+=$3; count++} END {print sum/count}'

# Quality metrics
grep "quality_score" logs/ai.log | awk '{if($3<80) failures++; total++} END {print failures/total*100 "%"}'
```

## Recovery Procedures

### Pipeline Recovery
1. **Assess the situation:**
   ```bash
   npm run pipeline:health-check
   ```

2. **Stop all processes:**
   ```bash
   npm run pipeline:stop
   ```

3. **Clear any stuck processes:**
   ```bash
   npm run pipeline:clear-locks
   ```

4. **Restart with monitoring:**
   ```bash
   npm run pipeline:start --verbose
   ```

### Data Recovery
```bash
# Backup current state
npm run db:backup

# Restore from backup if needed
npm run db:restore --backup-file=backup-2024-01-15.sql

# Replay missed events
npm run pipeline:replay --from=2024-01-15T10:00:00Z
```

### Emergency Contacts

**Technical Issues:**
- Pipeline failures: `admin@transferjuice.com`
- AI service issues: `ai-support@transferjuice.com`
- Database problems: `db-admin@transferjuice.com`

**Service Dependencies:**
- Neon Database: https://status.neon.tech
- OpenAI API: https://status.openai.com
- Twitter API: https://api.twitterstat.us

## Preventive Maintenance

### Daily Checks
- [ ] Pipeline execution status
- [ ] Quality metrics review
- [ ] Performance metrics analysis
- [ ] Error log review

### Weekly Maintenance
- [ ] Database performance optimization
- [ ] Cache cleanup and optimization
- [ ] AI model performance review
- [ ] Source reliability assessment

### Monthly Reviews
- [ ] Comprehensive system audit
- [ ] Security review and updates
- [ ] Capacity planning assessment
- [ ] Documentation updates

---

*This troubleshooting guide should be your first reference when issues arise. The Transfer Juice pipeline is designed for reliability, but when problems occur, systematic diagnosis and resolution will get you back online quickly.*