# Publishing imgflo to npm

This guide covers how to publish imgflo to the npm registry.

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm CLI logged in**: Run `npm login` and enter your credentials
3. **GitHub repository**: Already set up at https://github.com/bcooke/imgflo

## Pre-publish Checklist

Before publishing, make sure:

- [ ] Version number is updated in `package.json`
- [ ] All tests pass (when we add them)
- [ ] `npm run build` completes successfully
- [ ] README is up to date
- [ ] CHANGELOG exists and is updated
- [ ] LICENSE file is present (MIT)
- [ ] No sensitive data in the package

## Publishing Steps

### 1. Initialize Git Repository

```bash
# Initialize git if not already done
git init

# Add GitHub remote
git remote add origin https://github.com/bcooke/imgflo.git

# Create .gitignore if needed (already exists)
# Add all files
git add .

# First commit
git commit -m "Initial commit: imgflo v0.1.0"

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

This shows all files that will be included. Verify:
- `dist/` directory (compiled code)
- `README.md`
- `LICENSE`
- `package.json`
- NO `node_modules/`
- NO `.env` files
- NO test files

### 3. Test the Package Locally

```bash
# Create a tarball
npm pack

# This creates imgflo-0.1.0.tgz
# Install it in a test project
cd /tmp/test-project
npm install /path/to/imgflo/imgflo-0.1.0.tgz

# Test the CLI
imgflo --version
imgflo generate --help
```

### 4. Publish to npm

For first-time publishing:

```bash
# Make sure you're logged in
npm whoami

# Publish the package (public)
npm publish --access public
```

For subsequent releases:

```bash
# Update version (patch, minor, or major)
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# Build
npm run build

# Publish
npm publish
```

### 5. Verify Publication

```bash
# Check on npm registry
npm view imgflo

# Install from npm
npm install -g imgflo

# Test
imgflo --version
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0   | 2024-10-09 | Initial release with SVG generation, transformation, and S3 upload |

## npm Scripts

Our package.json includes:

- `npm run build` - Compile TypeScript
- `npm run dev` - Watch mode for development
- `npm run typecheck` - Type checking without build
- `npm test` - Run tests (when added)
- `prepublishOnly` - Automatically runs build before publishing

## Configuration for Users

After installation, users can configure imgflo:

### Global Installation

```bash
# Install globally
npm install -g imgflo

# Configure
imgflo config init

# Or set individual values
imgflo config set s3.bucket my-bucket
imgflo config set s3.region us-east-1
```

### Local Project

```bash
# Install in project
npm install imgflo

# Create local config
# Create imgflo.config.ts or .imgflorc.json
```

## Troubleshooting

### "You do not have permission to publish"

Make sure:
1. You're logged in: `npm login`
2. The package name isn't taken: `npm view imgflo`
3. You have access to the package (for updates)

### Package too large

Check size: `npm pack --dry-run`

Common fixes:
- Ensure `dist/` is in `.npmignore` for source, `.gitignore` for build artifacts
- Our current setup uses `files` in package.json (whitelist approach)

### CLI not working after install

Check:
- Shebang is present in CLI file: `#!/usr/bin/env node`
- File has execute permissions
- Package.json `bin` field is correct

## Publishing Checklist

Before each release:

1. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Update Documentation**
   - Update README with new features
   - Update CHANGELOG
   - Check all examples work

3. **Test Build**
   ```bash
   npm run build
   npm run typecheck
   ```

4. **Test CLI**
   ```bash
   npm link
   imgflo doctor
   # Test various commands
   npm unlink
   ```

5. **Git Commit & Tag**
   ```bash
   git add .
   git commit -m "Release v0.1.0"
   git tag v0.1.0
   git push origin main --tags
   ```

6. **Publish**
   ```bash
   npm publish
   ```

7. **Verify**
   ```bash
   npm view imgflo
   npm install -g imgflo@latest
   imgflo --version
   ```

## Future: Automated Publishing

Consider setting up GitHub Actions for:
- Automated testing on PR
- Automated publishing on version tags
- Automated changelog generation

Example workflow would:
1. Detect version tag push
2. Run tests
3. Build package
4. Publish to npm
5. Create GitHub release

## Support After Publishing

Users can:
- Report issues: https://github.com/bcooke/imgflo/issues
- View docs: https://github.com/bcooke/imgflo#readme
- Check on npm: https://www.npmjs.com/package/imgflo

## Unpublishing

If you need to unpublish (within 72 hours):

```bash
npm unpublish imgflo@0.1.0
```

⚠️ **Warning**: Unpublishing can break projects depending on your package. Use with caution!

## Beta/Alpha Releases

For testing before stable release:

```bash
# Publish as beta
npm version prerelease --preid=beta  # 0.1.0-beta.0
npm publish --tag beta

# Users install with
npm install imgflo@beta
```

## Package Registry Alternatives

imgflo can also be published to:
- **GitHub Packages**: For GitHub users
- **Private registries**: For internal use

Our package.json is configured for npm, but can be adapted.
