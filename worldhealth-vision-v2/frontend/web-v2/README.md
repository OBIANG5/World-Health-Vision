# web-v2

`web-v2` is the active V2 frontend shell for `WorldHealth Vision`.

It is designed to consume the V2 product facade exposed by `gateway-service`,
especially:

- `/api/product/countries/{iso3}/economic-snapshot`
- `/api/product/countries/{iso3}/relative-cost-snapshot`
- `/api/catalog/countries`

## Local development without Docker

Start the backend stack first in local mode:

- `catalog-service`
- `timeseries-service`
- `analytics-service`
- `gateway-service`

Then from this directory:

```powershell
npm install
npm run dev
```

Use Node.js `20.19+` or `22.12+` for the cleanest Vite experience.

The Vite dev server proxies `/api/*` to:

```text
http://localhost:8080
```

See the full startup order and the exact backend commands in:

- `../docs/architecture/local-run-without-docker.md`