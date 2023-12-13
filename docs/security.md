# Security

## Auditing Project Dependencies

Run `npm audit` to check for known vulnerabilities for the node modules listed in `package-lock.json`.

Latest run: `12-12-2023` - [read the report](./audit.md)

```bash
15 vulnerabilities (6 moderate, 7 high, 2 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force
```

## Resolving Vulnerabilities

Before attempting to resolve vulnerabilities, it's important to assess the risk; that is how much damage could it enable and how likely is it to be exploited in this environment.

In order to resolve vulnerabilities, you can:

- attempt to upgrade the package to a newer / the latest version of the package
- use package resolution to force a specific version of the package
- migrate to a different package