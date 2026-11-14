const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function prepareCloudflareDist() {
  const rootDir = path.resolve(__dirname, '..');
  const webDir = path.join(rootDir, 'apps', 'web');
  const distDir = path.join(webDir, 'dist');
  const nextDir = path.join(webDir, '.next');
  const publicDir = path.join(webDir, 'public');
  const appServerDir = path.join(nextDir, 'server', 'app');
  const staticDir = path.join(nextDir, 'static');

  console.log('[Cloudflare Dist] Preparing production distribution in:', distDir);

  // Clean old dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Copy public assets (favicon, images, etc.)
  if (fs.existsSync(publicDir)) {
    console.log('[Cloudflare Dist] Copying public/ assets...');
    copyDirRecursive(publicDir, distDir);
  }

  // 2. Copy Next.js static client chunks (_next/static)
  if (fs.existsSync(staticDir)) {
    console.log('[Cloudflare Dist] Copying .next/static/ chunks...');
    const destNextStatic = path.join(distDir, '_next', 'static');
    copyDirRecursive(staticDir, destNextStatic);
  }

  // 3. Copy rendered HTML pages from .next/server/app
  if (fs.existsSync(appServerDir)) {
    console.log('[Cloudflare Dist] Copying rendered HTML pages...');
    copyHtmlFiles(appServerDir, distDir);
  }

  console.log('[Cloudflare Dist] Distribution prepared successfully.');
}

function copyHtmlFiles(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'api') {
        copyHtmlFiles(srcPath, destDir);
      }
    } else if (entry.name.endsWith('.html')) {
      const destFile = path.join(destDir, entry.name);
      fs.copyFileSync(srcPath, destFile);
      console.log(`  -> Page: ${entry.name}`);
    }
  }
}

prepareCloudflareDist();
