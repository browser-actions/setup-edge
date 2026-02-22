<p>
  <a href="https://github.com/browser-actions/setup-edge/actions"><img alt="typescript-action status" src="https://github.com/browser-actions/setup-edge/workflows/build-test/badge.svg"></a>
</p>

# setup-edge

This action setups Microsoft Edge in the GitHub Actions environment.

- [X] Windows Support
- [X] macOS Support
- [X] Linux Support

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

### Input

- `edge-version`:
*(Optional)* The Edge version to be installed.  Supported versions are "stable", "beta", "dev", and "canary". Default: `stable`.

### Output

- `edge-version`: The installed Edge version. Useful when given a latest version.
- `edge-path`: The installed Edge path.

## Contributing

```bash
# Instal dependencies
pnpm install

# Run tests
pnpm lint
pnpm test

# Build and create package in dist/
pnpm build
pnpm package
```

## Release

Releases are automated with Release Please.  All changes must follow [Conventional Commits][], since Release Please derives versions and changelog entries from commit messages.

1. Merge some changes to the main branch.
2. Release Please opens or updates a release PR with version bumps and changelog updates.
3. Squash and merge the release PR to the main branch with a commit message that follows [Conventional Commits][].
4. Create a GitHub release and publish the action to the marketplace.

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/

## License

[MIT](LICENSE)
