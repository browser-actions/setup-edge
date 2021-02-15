<p>
  <a href="https://github.com/browser-actions/setup-edge/actions"><img alt="typescript-action status" src="https://github.com/browser-actions/setup-edge/workflows/build-test/badge.svg"></a>
</p>

# setup-edge

This action setups Microsoft Edge in the GitHub Actions environment.

- [X] Install and setup specific version of Microsoft Edge
- [X] Windows Support
- [ ] macOS Support
- [ ] Linux Support

## Usage

Basic usage:

```yaml
steps:
  - uses: browser-actions/setup-edge@latest
    with:
      edge-version: stable
  - name: Print Edge version
    run: (Get-Item (Get-Command msedge).Source).VersionInfo.ProductVersion
```

## Parameters

- `edge-version`:
*(Optional)* The Edge version to be installed.  Supported versions are "stable", "beta", "dev". Default: `stable`.

## License

[MIT](LICENSE)
