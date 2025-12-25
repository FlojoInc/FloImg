# Contributing to floimg

We welcome contributions of all kinds—code, documentation, examples, bug reports, and ideas.

## Ways to Contribute

### Code Contributions

- **New generators** - Add support for new image generation sources
- **Transform operations** - Extend image processing capabilities
- **Bug fixes** - Fix issues in existing functionality
- **Performance improvements** - Make things faster

### Non-Code Contributions

- **Documentation** - Improve guides, add examples, fix typos
- **Bug reports** - Help us identify and fix issues
- **Feature requests** - Suggest new capabilities
- **Community support** - Help others in discussions

## Contribution Process

### 1. Find or Create an Issue

Before starting work:

1. Check [existing issues](https://github.com/TeamFlojo/floimg/issues) to avoid duplicates
2. For bugs, create an issue describing the problem
3. For features, open a discussion first for larger changes
4. Comment on the issue to indicate you're working on it

### 2. Set Up Development Environment

See [[Development-Setup]] for detailed instructions.

```bash
git clone https://github.com/TeamFlojo/floimg.git
cd floimg
pnpm install
pnpm -r build
pnpm -r test
```

### 3. Create a Branch

```bash
git checkout -b type/description
```

Branch naming conventions:

- `feat/add-webp-support` - New features
- `fix/resize-memory-leak` - Bug fixes
- `docs/improve-quickstart` - Documentation
- `refactor/simplify-pipeline` - Code restructuring
- `chore/update-dependencies` - Maintenance

### 4. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new functionality
- Update documentation as needed

### 5. Test Your Changes

```bash
# Run all tests
pnpm -r test

# Run fast unit tests during development
pnpm test:unit

# Type check
pnpm -r typecheck
```

### 6. Submit a Pull Request

See [[Pull-Request-Guide]] for detailed PR guidelines.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer explicit types over `any`
- Use meaningful variable and function names

### Formatting

The project uses default TypeScript/JavaScript conventions:

- 2-space indentation
- Semicolons
- Double quotes for strings
- Trailing commas in multiline

### Comments

- Write self-documenting code where possible
- Add comments for complex logic
- Use JSDoc for public APIs

## Plugin Development

Creating a new generator plugin? See [[../architecture/Monorepo-Guide#Creating a New Plugin]] for the complete guide.

Key principles:

1. **Pass-through design** - Accept native library formats
2. **Minimal abstraction** - Let upstream libraries do the heavy lifting
3. **Complete documentation** - Every parameter documented
4. **Working examples** - Include runnable code samples

## Documentation

### Writing Style

- Use clear, concise language
- Include code examples
- Test all examples work
- No temporal language ("recently", "soon", "will") in evergreen docs

### Vault Structure

Documentation lives in `vault/`:

```
vault/
├── architecture/   # Technical architecture docs
├── community/      # Contributing and community docs
├── pm/            # Project management (tasks, bugs)
└── product/       # Product documentation
```

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/TeamFlojo/floimg/discussions)
- **Bugs**: Create an [Issue](https://github.com/TeamFlojo/floimg/issues)
- **Security**: See [[Security]] for responsible disclosure

## Recognition

Contributors are recognized in:

- Pull request acknowledgments
- Release notes for significant contributions
- The project README for major contributions

## See Also

- [[Development-Setup]] - Environment setup
- [[Pull-Request-Guide]] - PR process
- [[Code-of-Conduct]] - Community standards
- [[../architecture/Monorepo-Guide]] - Repository structure
