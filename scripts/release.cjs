const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const registry = 'https://registry.npmjs.org/';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || process.env.npm_config_dry_run === 'true';
const allowEmpty = args.includes('--allow-empty');
const bump = args.find(arg => !arg.startsWith('--')) || 'patch';
const npmCli = process.env.npm_execpath;
let published = false;
let version;

function run(command, parameters, capture = false, allowFailure = false) {
  const result = spawnSync(command, parameters, {
    cwd: root,
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (allowFailure) return '';
    throw new Error(`${command} ${parameters.join(' ')} failed (${result.status}).`);
  }
  return capture ? result.stdout.trim() : '';
}

/**
 * Refuse to cut a release when there is nothing new to release.
 *
 * A release that only bumps the version republishes identical code under a new
 * number. That is almost never intentional, and repeating it by accident is
 * hard to undo because the npm version can never be reused. The check is
 * deliberately narrow: it only aborts when the working tree is clean AND no
 * commit exists after the most recent release tag. Any new commit - or any
 * uncommitted change - means there is something to release and the check
 * stays silent. Pass --allow-empty to override it.
 */
function assertSomethingToRelease(override) {
  if (override) return;
  const status = run('git', ['status', '--porcelain'], true);
  if (status) return;
  const lastTag = run('git', ['describe', '--tags', '--abbrev=0', '--match', 'v*'], true, true);
  if (!lastTag) return;
  const ahead = run('git', ['rev-list', '--count', `${lastTag}..HEAD`], true, true);
  if (ahead && Number(ahead) > 0) return;
  throw new Error(
    `Nothing to release: the working tree is clean and no commit exists after ${lastTag}. ` +
      'Refusing to bump the version and publish identical code again. ' +
      'Make a change and commit it, or pass --allow-empty if a version-only release is intended.'
  );
}

function npm(parameters, capture = false) {
  return run(process.execPath, [npmCli, ...parameters], capture);
}

try {
  if (!npmCli) throw new Error('Run this script through npm run release.');
  const knownFlags = ['--dry-run', '--allow-empty'];
  if (
    !['patch', 'minor', 'major'].includes(bump) ||
    args.some(arg => arg.startsWith('--') && !knownFlags.includes(arg)) ||
    args.filter(arg => !arg.startsWith('--')).length > 1
  ) {
    throw new Error('Usage: npm run release -- [patch|minor|major] [--dry-run] [--allow-empty]');
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
    assertSomethingToRelease(allowEmpty);
    npm(['version', bump, '-m', 'chore: release %s']);
    version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    npm(['run', 'build']);

    // Pack once, inspect the actual archive contents, and publish that same archive.
    const packDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'index-system-release-'));
    const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', packDirectory], true));
    const files = new Set(packed.files.map(file => file.path));
    for (const required of [pkg.main, pkg.module, pkg.types, 'README.md', 'LICENSE']) {
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
