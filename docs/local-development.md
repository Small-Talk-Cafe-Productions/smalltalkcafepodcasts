# Local Development Guide

This guide explains how to run and test the Small Talk Café Podcasts website using a local npm installation (project-specific) rather than a system-wide installation.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Git**: For cloning the repository

## What is Local vs System-Wide npm?

- **System-wide npm**: Installed globally on your system (e.g., `/usr/local/bin/npm`)
- **Local npm**: Used from your project's `node_modules` folder, ensuring version consistency

## Installation Methods

### Method 1: Using npx (Recommended for Quick Testing)

`npx` executes packages from your local `node_modules` or downloads them temporarily. No global installation needed.

#### Steps:

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd smalltalkcafepodcasts
   ```

2. **Install dependencies locally**:
   ```bash
   npm install
   ```
   This creates a `node_modules` folder with all required packages.

3. **Run the development server**:
   ```bash
   npx astro dev
   ```
   Or use the npm scripts defined in package.json:
   ```bash
   npm run dev
   ```

4. **Access the website**:
   Open your browser and navigate to:
   ```
   http://localhost:4321
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Preview the production build**:
   ```bash
   npm run preview
   ```

### Method 2: Using Local Node/npm via nvm (Recommended for Long-term Development)

[nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) allows you to install and manage multiple Node.js versions locally without affecting your system.

#### Steps:

1. **Install nvm** (if not already installed):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Close and reopen your terminal**, then verify installation:
   ```bash
   nvm --version
   ```

3. **Install Node.js locally**:
   ```bash
   nvm install 18
   nvm use 18
   ```

4. **Verify you're using the local version**:
   ```bash
   which node
   # Should show something like: /Users/yourusername/.nvm/versions/node/v18.x.x/bin/node
   
   which npm
   # Should show something like: /Users/yourusername/.nvm/versions/node/v18.x.x/bin/npm
   ```

5. **Navigate to project directory**:
   ```bash
   cd smalltalkcafepodcasts
   ```

6. **Install project dependencies**:
   ```bash
   npm install
   ```

7. **Use the provided shell scripts** (these automatically load nvm):
   
   For development:
   ```bash
   ./dev.sh
   ```
   
   For building:
   ```bash
   ./build.sh
   ```

   Or run npm commands directly:
   ```bash
   npm run dev
   npm run build
   npm run preview
   ```

### Method 3: Using Project-Local Node Modules Directly

You can execute binaries directly from `node_modules/.bin`:

#### Steps:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run commands from node_modules**:
   ```bash
   ./node_modules/.bin/astro dev
   ./node_modules/.bin/astro build
   ./node_modules/.bin/astro preview
   ```

   Or add to your shell alias:
   ```bash
   alias astro='./node_modules/.bin/astro'
   ```

## Available Commands

Once dependencies are installed, you can use these npm scripts:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:4321 |
| `npm run start` | Alias for `npm run dev` |
| `npm run build` | Build the site for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run TypeScript type checking |

## Troubleshooting

### Port Already in Use

If port 4321 is already in use:
```bash
# Find and kill the process using the port
lsof -ti:4321 | xargs kill -9
```

Or specify a different port:
```bash
npx astro dev --port 3000
```

### Missing Dependencies

If you encounter missing dependency errors:
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Node Version Issues

Ensure you're using Node.js 18 or higher:
```bash
node --version
```

If using nvm:
```bash
nvm use 18
```

### Permission Errors

If you encounter permission errors, **never use sudo with npm**. Instead:
1. Use nvm (recommended)
2. Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

## Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Make changes**: Edit files in `src/`
3. **Hot reload**: Changes appear automatically in the browser
4. **Test build**: `npm run build` to ensure production build works
5. **Preview**: `npm run preview` to test the production build locally

## Project Structure

```
smalltalkcafepodcasts/
├── src/
│   ├── components/     # Astro components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes (file-based routing)
│   ├── styles/         # Global styles
│   └── utils/          # Utility functions
├── public/             # Static assets
├── dist/               # Build output (created by `npm run build`)
└── node_modules/       # Local dependencies (created by `npm install`)
```

## Next Steps

- Read the [GitHub Pages Deployment Guide](./github-pages-deployment.md) to learn how to deploy your site
- Check [Astro Documentation](https://docs.astro.build) for advanced features
- Customize the site configuration in `astro.config.mjs`
