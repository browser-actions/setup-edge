<p>
  <a href="https://github.com/browser-actions/setup-edge/actions"><img alt="typescript-action status" src="https://github.com/browser-actions/setup-edge/workflows/build-test/badge.svg"></a>
</p>

# setup-edge

This action sets up Microsoft Edge for GitHub Actions. This action supports the following features:

- Install and set up Microsoft Edge onto the runner.
- Install a specific release channel of Microsoft Edge (stable, beta, dev, and canary).
- Cross-platform runner support (Windows, macOS, Linux) and self-hosted runner support.

## Usage

Basic usage:

```yaml
steps:
  - uses: browser-actions/setup-edge@v1
  - name: Print Edge version
    run: (Get-Item (Get-Command msedge).Source).VersionInfo.ProductVersion
```

Install Edge Beta:

```yaml
steps:
  - uses: browser-actions/setup-edge@v1
    with:
      edge-version: beta
  - name: Print Edge version
    run: (Get-Item (Get-Command msedge).Source).VersionInfo.ProductVersion
```

### Supported version formats

| Version format | Example | Download source |
| --- | --- | --- |
| Channel name | `stable` (default), `beta`, `dev`, `canary` | [Microsoft Edge Updates][] |

[Microsoft Edge Updates]: https://edgeupdates.microsoft.com/api/products

## Supported platforms

| Linux x64 | Linux ARM64 | Linux ARM32 | macOS x64 | macOS ARM64 | Windows x64 | Windows ARM64 |
| ---       | ---         | ---         | ---       | ---         | ---         | ---           |
| ✅        | ✅          | ❌          | ✅        | ✅          | ✅          | ✅            |

## Parameters

### Input

- `edge-version`:
*(Optional)* The Edge version to be installed.  Supported versions are "stable", "beta", "dev", and "canary". Default: `stable`.

### Output

- `edge-version`: The installed Edge version. Useful when given a latest version.
- `edge-path`: The installed Edge path.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, workflow, and release process.

## License

[MIT](LICENSE)
