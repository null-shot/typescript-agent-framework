# Expense Tracker MCP Example

This example demonstrates how to use Cloudflare Workflows via an MCP Server to track and approve expenses, following the MCP server standard.

## Features

- Submit an expense (starts a workflow)
- Approve or reject an expense (triggers workflow event)
- List all expenses

## Running Locally

```sh
yarn install
cd examples/expense-mcp
yarn dev
# or: npx wrangler dev
```

## Using the MCP Inspector

1. Start your Worker as above.
2. In a new terminal, run:
   ```sh
   npx @modelcontextprotocol/inspector
   ```
3. Open the Inspector at http://localhost:6274 (use the session token if prompted).
4. Set the transport to Streamable HTTP and enter your Worker URL: http://127.0.0.1:8787
5. You will see the following MCP tools:
   - `submitExpense`: Submit a new expense (input: user, amount, description)
   - `approveExpense`: Approve an expense (input: expenseId)
   - `rejectExpense`: Reject an expense (input: expenseId)
   - `listExpenses`: List all expenses (no input)

### Example Output

When you run `listExpenses`, you might see output like this:

```json
Found 3 expenses: [
  {
    "id": "3fee1c6e-1317-48b3-a5d4-7c22bfb5e7bb",
    "user": "ray",
    "amount": 3000,
    "description": "air ticket to Singapore",
    "status": "approved"
  },
  {
    "id": "3f60bc20-4afc-404c-b821-8448d5324bea",
    "user": "ray",
    "amount": 200,
    "description": "dinner",
    "status": "rejected"
  },
  {
    "id": "fee8bf1e-cc0b-40cd-be95-8a8eaabf178f",
    "user": "ray",
    "amount": 1000,
    "description": "hotel in singapore",
    "status": "pending"
  }
]
```

## Notes

- This example uses an in-memory store for simplicity. In production, use D1 or KV for persistence.
- The workflow logic is in `src/workflow.ts`.
- The MCP server and tools are in `src/server.ts` and `src/tools.ts`. 