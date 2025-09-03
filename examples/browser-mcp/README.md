# Browser Rendering MCP Server

A comprehensive Model Context Protocol (MCP) server that demonstrates Cloudflare Browser Rendering capabilities for web scraping, automation, and data extraction tasks.

## ⚠️ IMPORTANT: Browser Rendering Quota Limits

**🚨 Cloudflare Browser Rendering has a 10-minute daily quota limit that applies to ALL usage:**

- ✅ **Development (`pnpm dev`)** → Uses quota
- ✅ **Production deployment** → Uses quota  
- ✅ **Local development (`wrangler dev`)** → **STILL uses quota!**
- ⚠️ **No unlimited local testing available** - all browser automation counts against your daily limit

**Quota Behavior:**
- **Daily Reset:** Quota resets every 24 hours (typically midnight UTC)
- **Account-Wide:** Shared across all workers in your Cloudflare account
- **Error Message:** `"Browser Rendering quota exceeded"` or `"Browser time limit exceeded for today"`

**Development Strategy:**
- Use quota sparingly during development
- Save quota for final testing and demos
- Consider using mock data for iterative development

## Features

### 🌐 Browser Automation Tools
- **navigate** - Navigate to URLs with customizable options (viewport, user agent, wait conditions)
- **screenshot** - Capture full page or element screenshots in multiple formats
- **extract_text** - Extract text content using CSS selectors or full page
- **extract_links** - Extract all links with filtering options (internal/external, text matching)
- **close_session** - Manage browser session lifecycle

### 📊 Session & Data Management
- **Browser Sessions** - Persistent browser sessions with metadata tracking
- **Page Cache** - R2-based caching of page content with TTL management
- **Extraction History** - D1 database storage of all scraping results
- **Extraction Patterns** - Reusable extraction patterns for different websites



## Quick Start

### 1. Installation

```bash
cd examples/browser-mcp
pnpm install
```

### 2. Configuration

Update `wrangler.jsonc` with your database and bucket IDs:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "browser-mcp-db",
      "database_id": "your-database-id-here"
    }
  ],
  "r2_buckets": [
    {
      "binding": "CACHE_BUCKET",
      "bucket_name": "your-bucket-name"
    }
  ]
}
```

### 3. Database Setup

Create and migrate your D1 database:

```bash
# Create database
wrangler d1 create browser-mcp-db

# Run migrations (tables will be created automatically on first run)
wrangler d1 migrations apply browser-mcp-db --local
```

### 4. Development Options

⚠️ **All options below use the same 10-minute daily quota:**

#### **🚀 Full Development Stack (Recommended)**
```bash
# Start both MCP Inspector + Worker (USES QUOTA)
pnpm dev
```
**Uses:** Browser Rendering quota (10min/day)  
**Benefits:** Complete testing environment with visual interface

#### **☁️ Worker Only**
```bash
# Start just the worker (USES QUOTA)
pnpm run dev:worker-only
```
**Uses:** Browser Rendering quota (10min/day)  
**Benefits:** Worker testing without inspector overhead

#### **🧪 Inspector Only**
```bash
# Start just MCP Inspector (no quota usage)
pnpm run dev:inspector-only
```
**Uses:** No quota (connect to remote workers)  
**Benefits:** Test against deployed workers

#### **🚀 Deploy to Production**
```bash
pnpm run deploy
```

## Using the MCP Inspector

### Connection Options

#### **Option 1: Local Development (Uses Quota)**
```
Transport: SSE
URL: http://localhost:8787/sse
```
**Pros:** Local development, faster iteration  
**Cons:** Uses your daily 10-minute quota

#### **Option 2: Remote Production (Uses Quota)**
```
Transport: SSE  
URL: https://your-worker.workers.dev/sse
```
**Pros:** Production environment testing  
**Cons:** Uses your daily 10-minute quota



### Quota Management Tips

1. **🎯 Focus Your Testing**
   - Plan your tests carefully
   - Use simple pages (e.g., `httpbin.org/html`) for basic functionality
   - Save complex sites for final validation

2. **⏰ Time Your Usage**
   - Check when your quota resets (typically midnight UTC)
   - Do intensive testing right after reset
   - Monitor remaining quota throughout the day

3. **🔄 Efficient Development**
   - Use the same browser session for multiple operations
   - Test tool logic with simple pages first
   - Validate selectors on lightweight sites

### Recommended Test Workflow

```json
// 1. Simple navigation test
{
  "name": "navigate",
  "arguments": {
    "url": "https://httpbin.org/html",
    "timeout": 15000
  }
}

// 2. Take screenshot to verify it's working (check the time captured on the screenshot!)
{
  "name": "screenshot", 
  "arguments": {
    "url": "https://www.timeanddate.com/",
    "fullPage": false,
    "timeout": 20000
  }
}

// 3. Extract text content
{
  "name": "extract_text",
  "arguments": {
    "url": "https://httpbin.org/html",
    "selectors": {
      "title": "h1",
      "content": "p"
    },
    "timeout": 15000
  }
}
```

### Screenshot Tool Example

The screenshot tool returns base64-encoded image data that displays directly in MCP Inspector and can be easily viewed using an HTML viewer:

#### **Step 1: Take a Screenshot**
```json
{
  "name": "screenshot", 
  "arguments": {
    "url": "https://www.weather.gov.hk/en/wxinfo/currwx/fnd.htm",
    "fullPage": false,
    "timeout": 20000
  }
}
```

#### **Step 2: View the Result**
The tool returns an HTML display with the screenshot embedded, plus raw base64 data.

#### **Step 3: Easy Viewing with HTML Viewer**
**Simplest method** - Copy the HTML output and paste into any HTML viewer:

1. **Copy the HTML output** from the MCP Inspector result
2. **Visit** [https://html.onlineviewer.net/](https://html.onlineviewer.net/) 
3. **Paste the HTML code** and view instantly
4. **See the live screenshot** with all metadata

#### **Real Test Results:**
Using Hong Kong Observatory weather page, you can see:
- **Live weather data** (32.1°C, 65% humidity at 11:20)
- **Current date** (3 Sep 2025, Wed)
- **9-day forecast** with real temperatures
- **Screenshot metadata** (Format: png, Size: 80KB, Full page: No)

**Key Benefits:**
- ✅ **Instant viewing** - No download or conversion needed
- 📱 **Mobile friendly** - Works on any device with a browser
- 🔍 **Full quality** - See the screenshot exactly as captured
- 📊 **Rich metadata** - Format, size, and capture settings included
- 🕒 **Real-time verification** - Timestamps and live data prove authenticity

### Extract Links Tool Example

The extract_links tool provides powerful link extraction with **strict filtering** that only matches visible link text or URLs:

#### **Step 1: Extract Links with Container Filter**
```json
{
  "name": "extract_links",
  "arguments": {
    "url": "https://github.com/null-shot/typescript-agent-framework/pulls?q=is%3Apr+",
    "filter": "container",
    "timeout": 60000
  }
}
```

#### **Step 2: View the Enhanced Results**
The tool returns a rich HTML display with organized link information.

#### **Real Test Results:**
```
🔗 Extracted Links from https://github.com/null-shot/typescript-agent-framework/pulls?q=is%3Apr+

Filters applied: Filter: "container"

[Total: 2] [Internal: 2] [External: 0]

[1] Internal | github.com
    https://github.com/null-shot/typescript-agent-framework/pull/80
    "🐛 Incorrect endpoint for remote container"

[2] Internal | github.com  
    https://github.com/null-shot/typescript-agent-framework/pull/75
    "Docker Container Is Not Running"
```



## Error Handling

### Expected Quota Errors

When you hit the quota limit, you'll see:

```json
{
  "error": "Navigation failed: Failed to create Cloudflare Puppeteer session session_xxx: Browser Rendering quota exceeded. Try the remote version: https://browser-mcp-server.raycoderhk.workers.dev/sse"
}
```

**This is normal and expected behavior!**

### Troubleshooting

**"Quota exceeded" errors:**
- ✅ **Expected** - you've used your daily 10-minute limit
- ⏰ **Solution** - Wait for daily reset (typically midnight UTC)
- 🔄 **Alternative** - Try different Cloudflare account if available



**MCP timeout errors:**
- If you see `"MCP error -32001: Request timed out"`:
  - ✅ **Try again** - Often resolves on retry (most effective solution)
  - ⏱️ **Increase timeout** - Add larger `timeout` value (e.g., `10000` for 10 seconds)

## Architecture

```
┌─────────────────────────────────────────┐
│           Browser MCP Server            │
├─────────────────────────────────────────┤
│ Tools: navigate, screenshot,            │
│        extract_text, extract_links,     │
│        close_session                    │
├─────────────────────────────────────────┤
│ Resources: sessions, results, cache,    │
│           patterns, status              │
├─────────────────────────────────────────┤
│ Prompts: web_scraper, automation_flow,  │
│         data_extractor                  │
├─────────────────────────────────────────┤
│        Browser Manager                  │
│   (Cloudflare Browser Rendering)        │
├─────────────────────────────────────────┤
│          Repository Layer               │
│     (D1 Database + R2 Cache)            │
├─────────────────────────────────────────┤
│      Cloudflare Workers Runtime         │
│  (Browser Rendering + D1 + R2)          │
└─────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.