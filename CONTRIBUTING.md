# Contributing

Thank you for your interest in contributing to GovRider's MCP server.

## Bug Reports

Open an issue on GitHub with:

- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Your environment (Node version, OS, MCP client)

## Feature Requests

Open an issue describing the use case and why it would be valuable.

## Development Setup

```bash
git clone https://github.com/carlosahumada89/govrider-mcp-server.git
cd govrider-mcp-server
npm install
npm run build
```

## Code Style

- TypeScript strict mode
- No `any` types
- Use `console.error()` for logging (never `console.log()` as stdout is reserved for MCP protocol)

## Pull Requests

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a PR with a clear description
