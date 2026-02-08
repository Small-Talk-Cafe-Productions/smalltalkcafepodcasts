# GitHub Pages Deployment Guide

This guide explains how to deploy the Small Talk Café Podcasts website to GitHub Pages.

## Prerequisites

- GitHub account
- Git installed on your local machine
- Repository pushed to GitHub
- Project built and tested locally (see [Local Development Guide](./local-development.md))

## Deployment Methods

### Method 1: GitHub Actions (Recommended - Automated)

This method automatically builds and deploys your site whenever you push to the main branch.

#### Step 1: Configure astro.config.mjs

Ensure your `astro.config.mjs` has the correct settings:

```javascript
export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/smalltalkcafepodcasts',
  // ... other config
});
```

**Important**: Replace `yourusername` with your actual GitHub username.

#### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  # Trigger on push to main branch
  push:
    branches: [ main ]
  # Allow manual trigger
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: GitHub Actions
4. Click **Save**

#### Step 4: Push and Deploy

```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

GitHub Actions will automatically build and deploy your site. Check the **Actions** tab to monitor progress.

#### Step 5: Access Your Site

Your site will be available at:
```
https://yourusername.github.io/smalltalkcafepodcasts/
```

---

### Method 2: Manual Deployment (Build Locally)

This method involves building the site locally and pushing the dist folder to a special branch.

#### Step 1: Install gh-pages Package

```bash
npm install --save-dev gh-pages
```

#### Step 2: Add Deploy Script to package.json

Add this script to your `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

#### Step 3: Configure astro.config.mjs

Ensure settings are correct (same as Method 1):

```javascript
export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/smalltalkcafepodcasts',
  // ... other config
});
```

#### Step 4: Deploy

```bash
npm run deploy
```

This command:
1. Builds your site (`npm run build`)
2. Pushes the `dist` folder to the `gh-pages` branch

#### Step 5: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**

Your site will be live in a few minutes.

---

### Method 3: Deploy from dist Folder (Subtree)

This method manually pushes the dist folder using git subtree.

#### Step 1: Build the Site

```bash
npm run build
```

#### Step 2: Create gh-pages Branch (First Time Only)

```bash
# Make sure dist/ is in .gitignore for main branch
echo "dist/" >> .gitignore
git add .gitignore
git commit -m "Ignore dist folder"

# Create orphan gh-pages branch
git checkout --orphan gh-pages
git reset --hard
git commit --allow-empty -m "Initial gh-pages commit"
git push origin gh-pages
git checkout main
```

#### Step 3: Deploy Using Subtree

```bash
# Build the site
npm run build

# Add dist to git temporarily (if gitignored)
git add -f dist/

# Commit dist folder
git commit -m "Build for deployment"

# Push dist folder to gh-pages branch
git subtree push --prefix dist origin gh-pages

# Remove dist from staging (if needed)
git reset HEAD~1
```

**Or create a deployment script** (`deploy-manual.sh`):

```bash
#!/bin/bash

echo "🏗️  Building site..."
npm run build

echo "📦 Deploying to GitHub Pages..."
git add -f dist
git commit -m "Deploy: $(date)"
git push origin `git subtree split --prefix dist main`:gh-pages --force
git reset HEAD~1

echo "✅ Deployment complete!"
echo "🌐 Site will be live at: https://yourusername.github.io/smalltalkcafepodcasts/"
```

Make it executable:
```bash
chmod +x deploy-manual.sh
```

Run it:
```bash
./deploy-manual.sh
```

---

## Configuration Details

### Site and Base URLs

In `astro.config.mjs`:

- **`site`**: Your GitHub Pages URL (e.g., `https://yourusername.github.io`)
- **`base`**: Repository name (e.g., `/smalltalkcafepodcasts`)

**Important**: 
- For a user/organization site (`yourusername.github.io`), set `base: '/'`
- For a project site (`yourusername.github.io/project`), set `base: '/project'`

### Testing Production Build Locally

Before deploying, always test the production build:

```bash
# Build
npm run build

# Preview (simulates production environment)
npm run preview
```

Access at `http://localhost:4321/smalltalkcafepodcasts/` (note the base path).

---

## Troubleshooting

### Assets Not Loading (404 Errors)

**Problem**: CSS, JS, or images return 404 errors.

**Solution**: Verify `base` in `astro.config.mjs` matches your repository name:
```javascript
base: '/smalltalkcafepodcasts',  // Must start with /
```

### Page Shows 404

**Problem**: Site shows GitHub's 404 page.

**Solutions**:
1. Wait a few minutes for GitHub Pages to build
2. Check **Settings** → **Pages** shows the correct source
3. Verify the site URL in **Settings** → **Pages**
4. Check **Actions** tab for build errors (if using GitHub Actions)

### Workflow Fails with Permission Errors

**Problem**: GitHub Actions fails with permission denied.

**Solution**: 
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
3. Click **Save**

### Build Fails on GitHub Actions

**Problem**: Build succeeds locally but fails in GitHub Actions.

**Solutions**:
1. Check Node.js version in workflow matches your local version
2. Ensure `package-lock.json` is committed
3. Review error logs in **Actions** tab
4. Try running `npm ci` locally to ensure clean install works

### Site Not Updating

**Problem**: Changes aren't reflected on the live site.

**Solutions**:
1. Clear browser cache (Cmd+Shift+R on Mac)
2. Wait a few minutes for GitHub Pages to rebuild
3. Check commit was pushed: `git log origin/main` (for Actions) or `git log origin/gh-pages` (for manual)
4. Verify workflow completed successfully in **Actions** tab

### Links Don't Work on GitHub Pages

**Problem**: Navigation between pages is broken.

**Solution**: Make sure all links in your Astro components use the correct base path:

```astro
---
// Use Astro's base path handling
import { base } from '../config/site.ts';
---

<a href={`${base}/about`}>About</a>

<!-- Or use Astro's built-in path handling -->
<a href="/about">About</a>  <!-- Astro auto-prepends base in production -->
```

---

## Custom Domain (Optional)

To use a custom domain (e.g., `podcasts.smalltalkcafe.com`):

### Step 1: Add CNAME Record

In your DNS provider, add a CNAME record:
```
CNAME: podcasts -> yourusername.github.io
```

### Step 2: Create CNAME File

Create `public/CNAME` with your domain:
```
podcasts.smalltalkcafe.com
```

### Step 3: Configure GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Custom domain**, enter: `podcasts.smalltalkcafe.com`
3. Wait for DNS check to complete
4. ✅ Enable **Enforce HTTPS**

### Step 4: Update astro.config.mjs

```javascript
export default defineConfig({
  site: 'https://podcasts.smalltalkcafe.com',
  base: '/',  // Root for custom domain
  // ... other config
});
```

---

## Best Practices

1. **Always test locally** before deploying:
   ```bash
   npm run build && npm run preview
   ```

2. **Use GitHub Actions** for automated deployments (less error-prone)

3. **Keep dependencies updated**:
   ```bash
   npm outdated
   npm update
   ```

4. **Use semantic commit messages**:
   ```bash
   git commit -m "feat: add new podcast episode"
   git commit -m "fix: correct broken links"
   git commit -m "docs: update README"
   ```

5. **Monitor build status** in the **Actions** tab

6. **Set up branch protection** for `main` branch:
   - Require pull request reviews
   - Require status checks to pass

---

## Deployment Checklist

- [ ] `site` URL is correct in `astro.config.mjs`
- [ ] `base` path matches repository name
- [ ] Production build works locally (`npm run build`)
- [ ] Preview shows site correctly (`npm run preview`)
- [ ] All images/assets are in `public/` directory
- [ ] Links use correct paths
- [ ] GitHub Pages is enabled in repository settings
- [ ] Workflow file exists (if using GitHub Actions)
- [ ] Deployment completed successfully
- [ ] Site loads correctly at GitHub Pages URL
- [ ] All pages and assets load without 404 errors

---

## Resources

- [Astro Deployment Docs](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Local Development Guide](./local-development.md)

---

## Need Help?

If you encounter issues:
1. Check **Actions** tab for build logs
2. Review [Astro's GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/)
3. Check that all steps in this guide were followed
4. Verify your `astro.config.mjs` settings
