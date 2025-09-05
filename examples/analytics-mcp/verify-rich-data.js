#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client({ name: 'verify', version: '1.0.0' });
const transport = new SSEClientTransport(new URL('https://analytics-mcp.raydp102.workers.dev/sse'));

await client.connect(transport);

const result = await client.callTool({
  name: 'query_analytics',
  arguments: {
    sql: 'SELECT blob3, double1, double2, double3, double4, double5 FROM github_stats WHERE blob2 = "claude_rich_data" ORDER BY blob3'
  }
});

const data = JSON.parse(result.content[0].text);
if (data.success) {
  console.log(`✅ Found ${data.data.data.length} days of rich Claude Code data!`);
  console.log('\nFirst 5 days:');
  data.data.data.slice(0, 5).forEach(row => {
    console.log(`${row.blob3}: PRs(${row.double1}/${row.double2}/${row.double3}) Issues(${row.double4}/${row.double5})`);
  });
  
  console.log('\nLast 5 days:');
  data.data.data.slice(-5).forEach(row => {
    console.log(`${row.blob3}: PRs(${row.double1}/${row.double2}/${row.double3}) Issues(${row.double4}/${row.double5})`);
  });
} else {
  console.log('❌ No data found');
}

await client.close();
