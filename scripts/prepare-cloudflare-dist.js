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

  // Ensure female-student.jpg exists in public/images
  const femaleStudentPath = path.join(publicDir, 'images', 'female-student.jpg');
  const heroStudentPath = path.join(publicDir, 'images', 'hero-student-proctoring.jpg');
  if (!fs.existsSync(femaleStudentPath) && fs.existsSync(heroStudentPath)) {
    console.log('[Cloudflare Dist] Creating female-student.jpg from hero-student-proctoring.jpg...');
    fs.copyFileSync(heroStudentPath, femaleStudentPath);
  }

  // 1. Copy public assets (favicon, images, manifests, etc.)
  if (fs.existsSync(publicDir)) {
    console.log('[Cloudflare Dist] Copying public/ assets...');
    copyDirRecursive(publicDir, distDir);
  }

  // Ensure manifest.webmanifest and manifest.json exist in dist
  const serverManifestBody = path.join(appServerDir, 'manifest.webmanifest.body');
  const distWebmanifest = path.join(distDir, 'manifest.webmanifest');
  const distJsonManifest = path.join(distDir, 'manifest.json');
  if (fs.existsSync(serverManifestBody)) {
    console.log('[Cloudflare Dist] Copying compiled manifest.webmanifest...');
    fs.copyFileSync(serverManifestBody, distWebmanifest);
    fs.copyFileSync(serverManifestBody, distJsonManifest);
  } else {
    const publicWebmanifest = path.join(publicDir, 'manifest.webmanifest');
    const publicJson = path.join(publicDir, 'manifest.json');
    if (fs.existsSync(publicJson)) {
      fs.copyFileSync(publicJson, distJsonManifest);
      fs.copyFileSync(publicJson, distWebmanifest);
    } else if (fs.existsSync(publicWebmanifest)) {
      fs.copyFileSync(publicWebmanifest, distWebmanifest);
      fs.copyFileSync(publicWebmanifest, distJsonManifest);
    }
  }

  // Ensure sitemap.xml exists in dist
  const serverSitemapBody = path.join(appServerDir, 'sitemap.xml.body');
  const serverSitemapXml = path.join(appServerDir, 'sitemap.xml');
  const distSitemap = path.join(distDir, 'sitemap.xml');
  const publicSitemap = path.join(publicDir, 'sitemap.xml');
  if (fs.existsSync(serverSitemapBody)) {
    console.log('[Cloudflare Dist] Copying compiled sitemap.xml.body to dist/sitemap.xml...');
    fs.copyFileSync(serverSitemapBody, distSitemap);
    fs.copyFileSync(serverSitemapBody, publicSitemap);
  } else if (fs.existsSync(serverSitemapXml)) {
    console.log('[Cloudflare Dist] Copying compiled sitemap.xml to dist/sitemap.xml...');
    fs.copyFileSync(serverSitemapXml, distSitemap);
    fs.copyFileSync(serverSitemapXml, publicSitemap);
  } else if (fs.existsSync(publicSitemap)) {
    console.log('[Cloudflare Dist] Copying public/sitemap.xml to dist/sitemap.xml...');
    fs.copyFileSync(publicSitemap, distSitemap);
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

function copyHtmlFiles(srcDir, baseDestDir, currentSub = '') {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'api') {
        const nextSub = currentSub ? path.join(currentSub, entry.name) : entry.name;
        copyHtmlFiles(srcPath, baseDestDir, nextSub);
      }
    } else if (entry.name.endsWith('.html')) {
      // 1. Root copy
      const rootDest = path.join(baseDestDir, entry.name);
      fs.copyFileSync(srcPath, rootDest);

      // 2. Preserved subfolder copy (e.g. dist/exam/quiz-min-all-mock.html)
      if (currentSub) {
        const subDestDir = path.join(baseDestDir, currentSub);
        fs.mkdirSync(subDestDir, { recursive: true });
        const subDestFile = path.join(subDestDir, entry.name);
        fs.copyFileSync(srcPath, subDestFile);

        // Also create index.html in subfolder for clean directory URLs
        const baseName = entry.name.replace('.html', '');
        const cleanDir = path.join(subDestDir, baseName);
        fs.mkdirSync(cleanDir, { recursive: true });
        fs.copyFileSync(srcPath, path.join(cleanDir, 'index.html'));

        // If it's inside exam/ or results/, also create top-level exam/index.html or results/index.html as fallback
        const topSubIndex = path.join(subDestDir, 'index.html');
        if (!fs.existsSync(topSubIndex)) {
          fs.copyFileSync(srcPath, topSubIndex);
        }
      }

      console.log(`  -> Page [${currentSub || 'root'}]: ${entry.name}`);
    }
  }
}

prepareCloudflareDist();
