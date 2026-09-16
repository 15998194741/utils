const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const registry = 'https://registry.npmjs.org/';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || process.env.npm_config_dry_run === 'true';
const bump = args.find(arg => !arg.startsWith('--')) || 'patch';
const npmCli = process.env.npm_execpath;
let published = false;
let version;

function run(command, parameters, capture = false) {
  const result = spawnSync(command, parameters, {
    cwd: root,
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${parameters.join(' ')} failed (${result.status}).`);
  return capture ? result.stdout.trim() : '';
}

function npm(parameters, capture = false) {
  return run(process.execPath, [npmCli, ...parameters], capture);
}

try {
  if (!npmCli) throw new Error('Run this script through npm run release.');
  if (!['patch', 'minor', 'major'].includes(bump) || args.some(arg => arg.startsWith('--') && arg !== '--dry-run') || args.filter(arg => !arg.startsWith('--')).length > 1) {
    throw new Error('Usage: npm run release -- [patch|minor|major] [--dry-run]');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (pkg.private) throw new Error('Cannot publish a private package.');
  const branch = run('git', ['branch', '--show-current'], true);
  if (!branch) throw new Error('Check out a branch before releasing.');
  run('git', ['remote', 'get-url', 'origin'], true);
  run('git', ['diff', '--check']);
  run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json', '--noEmit']);

  if (dryRun) {
    console.log(`Checks passed. Release would commit all non-ignored changes, bump ${bump}, build and publish ${pkg.name}, then push ${branch} and its version tag to origin.`);
    console.log('Dry run made no commits, version changes, builds, or network requests.');
  } else {
    npm(['whoami', '--registry', registry]);
    run('git', ['ls-remote', 'origin', `refs/heads/${branch}`], true);
    console.log('Committing all non-ignored changes in this repository.');
    run('git', ['add', '--all']);
    if (run('git', ['diff', '--cached', '--name-only'], true)) {
      run('git', ['commit', '-m', 'chore: prepare release']);
    }
    npm(['version', bump, '-m', 'chore: release %s']);
    version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    npm(['run', 'build']);

    // Pack once, inspect the actual archive contents, and publish that same archive.
    const packDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'index-system-release-'));
    const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', packDirectory], true));
    const files = new Set(packed.files.map(file => file.path));
    for (const required of [pkg.main, pkg.types, 'README.md', 'LICENSE']) {
      if (!required || !files.has(required.replace(/^\.\//, ''))) throw new Error(`Package is missing ${required}.`);
    }
    console.log(`Publishing ${pkg.name}@${version}: ${packed.filename}`);
    npm(['publish', path.join(packDirectory, packed.filename), '--access', 'public', '--tag', 'latest', '--registry', registry]);
    published = true;
    run('git', ['push', '--atomic', 'origin', `HEAD:refs/heads/${branch}`, `refs/tags/v${version}`]);
    console.log(`Released ${pkg.name}@${version} and pushed ${branch} with tag v${version}.`);
  }
} catch (error) {
  console.error(error.message);
  if (published) {
    console.error(`npm publication succeeded. Retry only the Git push: git push --atomic origin HEAD refs/tags/v${version}`);
  } else if (version) {
    console.error(`Local release v${version} exists. Inspect Git and npm state before retrying; running release again bumps another version.`);
  }
  process.exitCode = 1;
}
