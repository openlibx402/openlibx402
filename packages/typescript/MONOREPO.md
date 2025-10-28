# TypeScript Monorepo Setup

This directory contains all TypeScript/Node.js packages for OpenLibX402, organized as a **pnpm workspace monorepo** (similar to the Python packages using `uv`).

## 📦 Monorepo Structure

```
packages/typescript/
├── openlibx402-core/         # Core models, errors, Solana processor
├── openlibx402-client/       # HTTP clients with payment handling
├── openlibx402-express/      # Express.js middleware
├── openlibx402-langchain/    # LangChain.js integration
└── openlibx402-langgraph/    # LangGraph.js integration

examples/
└── express-server/        # Express.js example application
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

Install pnpm if you haven't:
```bash
npm install -g pnpm
```

### Setup Everything

```bash
# Install all dependencies for all packages
pnpm install

# Build all packages in correct order
pnpm run build
```

## 📝 Common Commands

### Using pnpm (npm-style)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm --filter @openlibx402/core run build

# Run tests
pnpm run test

# Watch mode for development
pnpm run dev

# Clean build artifacts
pnpm run clean
```

### Using Makefile (Python uv-style)

```bash
# Show all commands
make help

# Setup (install + build)
make setup

# Build all packages
make build

# Build specific packages
make build-core
make build-client
make build-express

# Development
make dev
make test
make lint

# Examples
make example-server
make example-dev

# Clean everything
make clean

# Full rebuild
make rebuild
```

## 🔧 Package Management

### Adding Dependencies

**To a specific package:**
```bash
# Regular dependency
pnpm --filter @openlibx402/core add axios

# Dev dependency
pnpm --filter @openlibx402/core add -D jest

# Workspace dependency
# (already configured in package.json with workspace:*)
```

**To root (shared dev tools):**
```bash
pnpm add -D -w prettier
```

### Workspace Dependencies

Packages reference each other using `workspace:*`:

```json
{
  "dependencies": {
    "@openlibx402/core": "workspace:*"
  }
}
```

This tells pnpm to link to the local workspace version during development and resolve to the correct version when publishing.

## 🏗️ Build Order

pnpm automatically handles build order based on dependencies:

1. **@openlibx402/core** (no dependencies)
2. **@openlibx402/client** (depends on core)
3. **@openlibx402/express** (depends on core)
4. **@openlibx402/langchain** (depends on core, client)
5. **@openlibx402/langgraph** (depends on core, client)
6. **Examples** (depend on published packages)

## 📊 Workspace Configuration

### pnpm-workspace.yaml

Defines which directories are part of the workspace:

```yaml
packages:
  - 'packages/typescript/*'
  - 'examples/express-server'
```

### package.json (root)

Defines workspace-wide scripts and dev dependencies:

```json
{
  "scripts": {
    "build": "pnpm --filter \"./packages/typescript/*\" run build",
    "test": "pnpm --filter \"./packages/typescript/*\" run test"
  }
}
```

### .npmrc

Configures pnpm behavior:

```
link-workspace-packages=true
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

## 🔍 Working with Individual Packages

### Navigate to package
```bash
cd packages/typescript/openlibx402-core
```

### Run commands in package
```bash
pnpm build
pnpm test
pnpm dev
```

### Or from root
```bash
pnpm --filter @openlibx402/core run build
pnpm --filter @openlibx402/core run test
```

## 🚦 Development Workflow

### 1. Initial Setup
```bash
make setup
# or
pnpm install && pnpm run build
```

### 2. Make Changes
Edit files in any package

### 3. Build
```bash
# Build all
pnpm run build

# Build specific package
pnpm --filter @openlibx402/core run build

# Watch mode (auto-rebuild)
pnpm --filter @openlibx402/core run dev
```

### 4. Test
```bash
# Test all
pnpm run test

# Test specific
pnpm --filter @openlibx402/core run test
```

### 5. Run Example
```bash
pnpm run example:server
# or
make example-server
```

## 🔄 Comparison with Python uv Setup

| Python (uv) | TypeScript (pnpm) |
|-------------|-------------------|
| `uv sync` | `pnpm install` |
| `uv run` | `pnpm run` |
| `uv add` | `pnpm add` |
| `pyproject.toml` | `package.json` |
| Workspace members in `pyproject.toml` | `pnpm-workspace.yaml` |
| Path dependencies | `workspace:*` protocol |

## 📦 Publishing (Future)

When ready to publish to npm:

```bash
# Build all packages
pnpm run build

# Publish individual packages
cd packages/typescript/openlibx402-core
npm publish --access public

# Or use changeset/lerna for coordinated releases
```

## 🐛 Troubleshooting

### Clean install
```bash
make clean
make setup
```

### Force reinstall
```bash
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

### Build errors
```bash
# Clean and rebuild
pnpm run clean
pnpm run build
```

### Workspace linking issues
```bash
# Check workspace links
pnpm list --depth 0

# Reinstall with fresh links
rm -rf node_modules
pnpm install
```

## 📚 Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm CLI](https://pnpm.io/cli/install)
- [Turborepo](https://turbo.build/repo/docs) (optional build system)
- [Changesets](https://github.com/changesets/changesets) (for versioning)

## 💡 Tips

1. **Use filters**: `pnpm --filter <package>` to run commands on specific packages
2. **Parallel builds**: pnpm builds packages in parallel when possible
3. **Shared configs**: Put eslint, prettier, tsconfig in root and extend them
4. **Dev dependencies**: Keep most dev tools in root package.json
5. **Watch mode**: Use `pnpm run dev` for auto-rebuilding during development
