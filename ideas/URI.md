# Prime URI Scheme

Remote premises are referenced via `prime://` URIs:

```
prime://github.com/owner/repo/main/path/to/claim.md
```

Pin to a specific commit for immutability:

```
prime://github.com/owner/repo@abc123/path/to/claim.md
```

Define aliases in `prime.yaml` to avoid repeating full URIs:

```yaml
remotes:
  logic: github.com/owner/foundations
```

Then reference as:

```
prime://@logic/axioms/identity.md
```
