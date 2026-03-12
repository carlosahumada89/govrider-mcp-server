# Security

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

- Email: [contact@govrider.ai](mailto:contact@govrider.ai)
- Do not open a public GitHub issue for security vulnerabilities

We will acknowledge your report within 48 hours and provide a timeline for a fix.

## How API Keys are Handled

- API keys are passed via environment variables and transmitted over HTTPS only
- Keys are never logged, stored in plaintext, or transmitted to any third party
- On GovRider's servers, only SHA-256 hashes of keys are stored
- Keys can be revoked at any time at [govrider.ai/app/api-keys](https://govrider.ai/app/api-keys)

## Rate Limiting

- 60 requests per minute per API key
- Exceeding the limit returns HTTP 429

## Data Privacy

- GovRider processes your search queries to match against government procurement data
- Queries are logged for usage metering but are not shared with third parties
- All government procurement data comes from official public sources
