// NOTE: This script should be work without any dependencies.
const fs = require('fs');
const path = require('path');
const rootPackage = require('../package.json');

/**
 * @param  {...string} fragments
 */
const rootdir = (...fragments) => {
  return path.resolve(__dirname, '../', ...fragments);
};

const targets = {
  server: rootdir('dist'),
  mcs: rootdir('dist/mcs-workdir'),
};

fs.mkdirSync(rootdir('dist'), { recursive: true });
fs.mkdirSync(rootdir('dist/mcs-workdir'), { recursive: true });

Object.entries(targets).forEach(([target, dest]) => {
  const { scripts = {}, dependencies: targetDependencies = {} } = rootPackage[target];
  const { name, version, author, license, homepage, dependencies: rootDependencies } = rootPackage;

  const dependencies = Object.keys(targetDependencies).reduce((acc, target) => {
    if (target in rootDependencies) {
      acc[target] = rootDependencies[target];
    }
    return acc;
  }, {});
  const packageJson = { name, version, author, license, homepage, scripts, dependencies };
  const packageJsonStr = JSON.stringify(packageJson, null, '  ');

  fs.writeFileSync(path.resolve(dest, 'package.json'), packageJsonStr);
  fs.copyFileSync(rootdir('package-lock.json'), path.resolve(dest, 'package-lock.json'));
});
