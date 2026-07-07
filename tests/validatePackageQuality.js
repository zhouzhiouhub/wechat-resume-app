const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appConfig = require('../app.json');
const projectConfig = require('../project.config.json');
const resumeData = require('../modules/resume/resumeData');

const rootDir = path.resolve(__dirname, '..');
const maxMainPackageBytes = 1.5 * 1024 * 1024;
const maxMediaBytes = 200 * 1024;
const mediaExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.wav', '.aac', '.m4a']);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function getIgnoredEntries() {
  return (projectConfig.packOptions && projectConfig.packOptions.ignore) || [];
}

function isIgnored(relativePath) {
  const normalizedPath = normalizePath(relativePath);

  return getIgnoredEntries().some((entry) => {
    const value = normalizePath(entry.value || '');

    if (!value) {
      return false;
    }

    if (entry.type === 'folder') {
      return normalizedPath === value || normalizedPath.startsWith(`${value}/`);
    }

    if (entry.type === 'file') {
      return normalizedPath === value;
    }

    if (entry.type === 'suffix') {
      return normalizedPath.endsWith(value);
    }

    if (entry.type === 'prefix') {
      return normalizedPath.startsWith(value);
    }

    if (entry.type === 'regexp') {
      return new RegExp(value).test(normalizedPath);
    }

    return false;
  });
}

function isCloudFunctionFile(relativePath) {
  const cloudRoot = normalizePath(projectConfig.cloudfunctionRoot || '');
  const normalizedPath = normalizePath(relativePath);

  return Boolean(cloudRoot && (normalizedPath === cloudRoot || normalizedPath.startsWith(`${cloudRoot}/`)));
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalizePath(path.relative(rootDir, fullPath));

    if (entry.isDirectory()) {
      if (relativePath === '.git' || isCloudFunctionFile(relativePath) || isIgnored(relativePath)) {
        return [];
      }

      return listFiles(fullPath);
    }

    return [fullPath];
  });
}

function getPackageFiles() {
  return listFiles(rootDir)
    .map((filePath) => ({
      fullPath: filePath,
      relativePath: normalizePath(path.relative(rootDir, filePath))
    }))
    .filter((file) => !file.relativePath.startsWith('.git/'))
    .filter((file) => !isCloudFunctionFile(file.relativePath))
    .filter((file) => !isIgnored(file.relativePath));
}

function assertMediaWithinLimit(file) {
  const size = fs.statSync(file.fullPath).size;

  assert.ok(
    size <= maxMediaBytes,
    `${file.relativePath} is ${(size / 1024).toFixed(1)}KB, expected <= 200KB`
  );
}

function getResumeAssetPaths() {
  const paths = [];

  resumeData.projects.forEach((project) => {
    if (project.cover) {
      paths.push(project.cover);
    }

    (project.screenshots || []).forEach((screenshot) => {
      paths.push(screenshot);
    });
  });

  return [...new Set(paths)];
}

function runCheck(name, check) {
  try {
    check();
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}`);
    throw error;
  }
}

runCheck('component lazy loading is enabled', () => {
  assert.strictEqual(appConfig.lazyCodeLoading, 'requiredComponents');
});

runCheck('packaged media assets stay below the scan threshold', () => {
  getPackageFiles()
    .filter((file) => mediaExtensions.has(path.extname(file.relativePath).toLowerCase()))
    .forEach(assertMediaWithinLimit);
});

runCheck('resume project assets point to packaged small files', () => {
  getResumeAssetPaths().forEach((assetPath) => {
    const relativePath = normalizePath(assetPath);
    const fullPath = path.join(rootDir, relativePath);

    assert.ok(fs.existsSync(fullPath), `${relativePath} does not exist`);
    assert.strictEqual(isIgnored(relativePath), false, `${relativePath} should be packaged`);
    assertMediaWithinLimit({ fullPath, relativePath });
  });
});

runCheck('estimated main package is under 1.5MB', () => {
  const packageBytes = getPackageFiles().reduce((total, file) => total + fs.statSync(file.fullPath).size, 0);

  assert.ok(
    packageBytes <= maxMainPackageBytes,
    `estimated package size is ${(packageBytes / 1024 / 1024).toFixed(2)}MB, expected <= 1.5MB`
  );
});

console.log('Package quality validation passed.');
