import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { packageAndroidApk } from './package';

const buildScript = fileURLToPath(import.meta.url);
const scriptsPath = path.dirname(buildScript);
const rootPath = path.resolve(scriptsPath, '..');
const versionsFile = path.resolve(rootPath, 'versioning.json');
const systemIdentity = '20b9367b-9f23-4c50-8caa-bea9c65fb8b8';
const artifactsPath = path.resolve(rootPath, '/.aistudio/artifacts/brain/');

interface VersionState {
  major: number;
  minor: number;
  release: number;
  codename: string;
  buildCount: number;
}

// 1. Read or initialize version state
let versionState: VersionState = {
  major: 1,
  minor: 0,
  release: 0,
  codename: 'genesis',
  buildCount: 0,
};

if (fs.existsSync(VERSION_FILE)) {
  try {
    const raw = fs.readFileSync(VERSION_FILE, 'utf-8');
    versionState = JSON.parse(raw);
    // Increment release on build
    versionState.release += 1;
    versionState.buildCount += 1;
  } catch (err) {
    console.warn('Could not parse .version.json, resetting to 1.0.0-genesis');
  }
} else {
  versionState.buildCount = 1;
}

// Write updated version state
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionState, null, 2), 'utf-8');

const versionString = `${versionState.major}.${versionState.minor}.${versionState.release}-${versionState.codename}`;
console.log(`\n========================================`);
console.log(`Vector Studio Distribution Packager`);
console.log(`Active Release: ${versionString}`);
console.log(`========================================\n`);

// 2. Ensure docs exist and sync to artifacts
const docFiles = ['Components.md', 'Architecture.md', 'Documentation.md'];

// Ensure artifact directory exists
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

docFiles.forEach((docFile) => {
  const sourcePath = path.join(rootDir, docFile);
  if (fs.existsSync(sourcePath)) {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const artifactPath = path.join(ARTIFACT_DIR, docFile);
    fs.writeFileSync(artifactPath, content, 'utf-8');
    console.log(`✓ Synchronized artifact: ${artifactPath}`);
  }
});

// 3. Create distribution directory: /distribution/{major.minor.release-codename}
const distOutputDir = path.join(rootDir, 'distribution', versionString);
if (!fs.existsSync(distOutputDir)) {
  fs.mkdirSync(distOutputDir, { recursive: true });
}

// Helper to copy files or directories recursively
function copyRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 4. Copy dist/ compiled web application bundle
const compiledDistDir = path.join(rootDir, 'dist');
if (fs.existsSync(compiledDistDir)) {
  const targetAppDir = path.join(distOutputDir, 'app');
  copyRecursive(compiledDistDir, targetAppDir);
  console.log(`✓ Copied compiled application to: ${targetAppDir}`);
}

// 5. Wrap application as standalone Android APK and copy to distribution folder
const apkFileName = `vector_studio-${versionString}.apk`;
const outputApkPath = path.join(distOutputDir, apkFileName);
const androidSubDir = path.join(distOutputDir, 'android');
if (!fs.existsSync(androidSubDir)) {
  fs.mkdirSync(androidSubDir, { recursive: true });
}

packageAndroidApk({
  distDir: compiledDistDir,
  outputApkPath: outputApkPath,
  versionName: versionString,
  versionCode: versionState.release || 1,
});

// Also place a copy inside /distribution/{version}/android/
const subDirApkPath = path.join(androidSubDir, apkFileName);
fs.copyFileSync(outputApkPath, subDirApkPath);
console.log(`✓ Copied Android APK package to: ${subDirApkPath}`);

// Make APK downloadable from web app directly
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
if (!fs.existsSync(publicDownloadsDir)) {
  fs.mkdirSync(publicDownloadsDir, { recursive: true });
}
const webDownloadApk = path.join(publicDownloadsDir, 'vector_studio.apk');
fs.copyFileSync(outputApkPath, webDownloadApk);
console.log(`✓ Published web-downloadable Android APK at: ${webDownloadApk}`);

// 6. Copy doc artifacts into distribution directory
const targetDocsDir = path.join(distOutputDir, 'docs');
if (!fs.existsSync(targetDocsDir)) {
  fs.mkdirSync(targetDocsDir, { recursive: true });
}

docFiles.forEach((docFile) => {
  const srcDoc = path.join(rootDir, docFile);
  if (fs.existsSync(srcDoc)) {
    fs.copyFileSync(srcDoc, path.join(targetDocsDir, docFile));
    fs.copyFileSync(srcDoc, path.join(distOutputDir, docFile));
  }
});
console.log(`✓ Bundled technical documentation to: ${distOutputDir}`);

// 7. Write distribution manifest
const apkStat = fs.statSync(outputApkPath);
const manifest = {
  application: 'Vector Studio',
  version: versionString,
  releaseCodename: versionState.codename,
  major: versionState.major,
  minor: versionState.minor,
  release: versionState.release,
  buildTimestamp: new Date().toISOString(),
  targetPlatforms: ['web', 'macos', 'windows', 'linux', 'ios', 'android'],
  androidApk: {
    fileName: apkFileName,
    filePath: outputApkPath,
    fileSizeMb: (apkStat.size / (1024 * 1024)).toFixed(2),
    packageName: 'com.vectorstudio.app',
  },
  artifacts: docFiles,
  distributionPath: distOutputDir,
};

fs.writeFileSync(
  path.join(distOutputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.log(`\n✓ Distribution release packaged successfully at: /distribution/${versionString}\n`);
