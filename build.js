
// Windows-friendly Node ESM script (run with: node build.js)
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { build as esbuild } from 'esbuild';

const ROOT = process.cwd();
const THEMES_DIR = path.join(ROOT, 'themes');
const VENDOR_DIR = path.join(ROOT, 'vendor');
const DIST_DIR = path.join(ROOT, 'dist');

async function ensureDirs() {
  for (const p of [THEMES_DIR, VENDOR_DIR, DIST_DIR]) {
    await fs.mkdir(p, { recursive: true }).catch(() => {});
  }
}

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function detectPM() {
  try { execSync('pnpm -v', { stdio: 'ignore' }); return 'pnpm'; } catch {}
  try { execSync('npm -v',  { stdio: 'ignore' }); return 'npm';  } catch {}
  try { execSync('yarn -v', { stdio: 'ignore' }); return 'yarn'; } catch {}
  throw new Error('No package manager found. Please install pnpm, npm, or yarn.');
}

async function installDeps(pm) {
  const deps = 'bootstrap@^5 bootswatch@^5';
  if (pm === 'pnpm') run(`pnpm add ${deps}`);
  else if (pm === 'npm') run(`npm install ${deps}`);
  else if (pm === 'yarn') run(`yarn add ${deps}`);
}

async function copyBootstrapAssets() {
  const bootstrapCssSrc = path.join(ROOT, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css');
  const bootstrapJsSrc  = path.join(ROOT, 'node_modules', 'bootstrap', 'dist', 'js',  'bootstrap.bundle.min.js');
  await fs.copyFile(bootstrapCssSrc, path.join(THEMES_DIR, 'bootstrap.min.css'));
  await fs.copyFile(bootstrapJsSrc,  path.join(VENDOR_DIR,  'bootstrap.bundle.min.js'));
  console.log('Copied Bootstrap CSS & JS');
}

async function copyBootswatchThemes() {
  const srcBase = path.join(ROOT, 'node_modules', 'bootswatch', 'dist');
  const items = await fs.readdir(srcBase, { withFileTypes: true });
  const themes = [];
  for (const dirent of items) {
    if (dirent.isDirectory()) {
      const themeName = dirent.name;
      themes.push(themeName);
      const srcDir = path.join(srcBase, themeName);
      const destDir = path.join(THEMES_DIR, themeName);
      await fs.mkdir(destDir, { recursive: true });
      const themeFiles = await fs.readdir(srcDir, { withFileTypes: true });
      for (const f of themeFiles) {
        if (f.isFile()) {
          await fs.copyFile(path.join(srcDir, f.name), path.join(destDir, f.name));
        }
      }
    }
  }
  await fs.writeFile(path.join(THEMES_DIR, 'themes.json'), JSON.stringify(themes.sort(), null, 2));
  console.log(`Copied ${themes.length} Bootswatch themes and wrote themes/themes.json`);
}

async function buildBundles(pm) {
  const tscCmd = pm === 'pnpm' ? 'pnpm exec tsc --emitDeclarationOnly' : 'npx tsc --emitDeclarationOnly';
  run(tscCmd);
  await esbuild({
    entryPoints: [path.join(ROOT, 'src', 'BootSwatcher.ts')],
    bundle: true,
    format: 'esm',
    target: ['es2020'],
    outfile: path.join(DIST_DIR, 'BootSwatcher.mjs'),
    sourcemap: true,
    banner: { js: '/* bootswatcher ESM build */' },
  });
  await esbuild({
    entryPoints: [path.join(ROOT, 'src', 'BootSwatcher.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'BootSwatcherComponent',
    target: ['es2018'],
    outfile: path.join(DIST_DIR, 'bootswatcher.iife.js'),
    sourcemap: true,
    banner: { js: '/* bootswatcher IIFE build */' },
  });
}

async function copyToDist() {
  await fs.copyFile(path.join(ROOT, 'index.prod.html'), path.join(DIST_DIR, 'index.html'));
  async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const e of entries) {
      const s = path.join(src, e.name);
      const d = path.join(dest, e.name);
      if (e.isDirectory()) {
        await copyDir(s, d);
      } else {
        await fs.copyFile(s, d);
      }
    }
  }
  await copyDir(THEMES_DIR, path.join(DIST_DIR, 'themes'));
  await copyDir(VENDOR_DIR,  path.join(DIST_DIR, 'vendor'));
  console.log('Prepared dist/');
}

async function main() {
  await ensureDirs();
  const pm = detectPM();
  console.log(`Using package manager: ${pm}`);
  await installDeps(pm);
  await copyBootstrapAssets();
  await copyBootswatchThemes();
  await buildBundles(pm);
  await copyToDist();
  console.log('Build complete. Open dist/index.html with a static server.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
