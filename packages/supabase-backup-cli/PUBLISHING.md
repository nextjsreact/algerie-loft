# Publishing Guide

## Prerequisites

1. **npm account**: Create at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` and enter credentials
3. **Package name available**: Check at https://www.npmjs.com/package/supabase-backup-cli

## Pre-Publication Checklist

- [ ] All tests pass
- [ ] Documentation is complete
- [ ] README.md is comprehensive
- [ ] LICENSE file is present
- [ ] Version number is updated in package.json
- [ ] CHANGELOG.md is updated
- [ ] Examples are tested
- [ ] TypeScript builds successfully

## Build and Test

```bash
cd packages/supabase-backup-cli

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally
npm link
supabase-backup --help

# Test in another project
cd /path/to/test-project
npm link supabase-backup-cli
supabase-backup create
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

## Publishing Steps

### 1. Dry Run

Test the publication without actually publishing:

```bash
npm publish --dry-run
```

Review the output to ensure only necessary files are included.

### 2. Publish to npm

```bash
# Public package (free)
npm publish --access public

# Or for scoped packages
npm publish --access public
```

### 3. Verify Publication

```bash
# Check on npm
npm view supabase-backup-cli

# Install and test
npm install -g supabase-backup-cli
supabase-backup --version
```

## Post-Publication

### 1. Create Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create GitHub Release

1. Go to https://github.com/yourusername/supabase-backup-cli/releases
2. Click "Create a new release"
3. Select the tag (v1.0.0)
4. Add release notes from CHANGELOG.md
5. Publish release

### 3. Update Documentation

- Update README.md with installation instructions
- Update examples if needed
- Announce on social media, forums, etc.

## Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
        working-directory: packages/supabase-backup-cli
      
      - name: Build
        run: npm run build
        working-directory: packages/supabase-backup-cli
      
      - name: Publish to npm
        run: npm publish --access public
        working-directory: packages/supabase-backup-cli
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### Error: "Package name already exists"

Choose a different name or use a scoped package:
```json
{
  "name": "@yourusername/supabase-backup-cli"
}
```

### Error: "You must be logged in"

```bash
npm login
```

### Error: "403 Forbidden"

Check package name availability and npm permissions.

### Files not included/excluded correctly

Update `.npmignore` or use `files` field in package.json:

```json
{
  "files": [
    "dist",
    "bin",
    "README.md",
    "LICENSE"
  ]
}
```

## Maintenance

### Regular Updates

1. Monitor issues and pull requests
2. Update dependencies regularly
3. Test with latest Supabase versions
4. Keep documentation up to date

### Security

1. Enable 2FA on npm account
2. Use npm audit to check vulnerabilities
3. Keep dependencies updated
4. Review security advisories

### Deprecation

If you need to deprecate a version:

```bash
npm deprecate supabase-backup-cli@1.0.0 "Please upgrade to 2.0.0"
```

## Marketing

### npm Keywords

Ensure good keywords in package.json:
```json
{
  "keywords": [
    "supabase",
    "backup",
    "restore",
    "database",
    "postgresql",
    "storage",
    "cli",
    "migration",
    "disaster-recovery"
  ]
}
```

### Promotion Channels

- [ ] Supabase Discord
- [ ] Supabase GitHub Discussions
- [ ] Reddit (r/Supabase)
- [ ] Twitter/X
- [ ] Dev.to article
- [ ] Product Hunt
- [ ] Hacker News (Show HN)

### Documentation Sites

- [ ] Create website with Docusaurus/VitePress
- [ ] Add to Supabase community resources
- [ ] Create video tutorial
- [ ] Write blog post

## Support

### Issue Templates

Create `.github/ISSUE_TEMPLATE/`:

1. `bug_report.md`
2. `feature_request.md`
3. `question.md`

### Contributing Guide

Create `CONTRIBUTING.md` with:
- Code of conduct
- Development setup
- Pull request process
- Coding standards

## License

Ensure LICENSE file is included and referenced in package.json:

```json
{
  "license": "MIT"
}
```

## Changelog

Maintain `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [1.0.0] - 2026-02-27

### Added
- Initial release
- Complete backup functionality
- Restore functionality
- Environment cloning
- CLI interface
- Programmatic API

### Changed
- N/A

### Fixed
- N/A
```

---

**Ready to publish?** Follow the steps above and share your awesome tool with the Supabase community! 🚀
