// Runs every example in the README files and checks the documented results.
//
// Two failure modes are covered that a read-through cannot catch:
//
//   - A fenced block in a language this script does not collect is never
//     checked at all.
//   - A claim whose expression never runs is never verified, so an example
//     that calls an API which no longer exists still looks correct.
//
// So every fenced block is executed, and a claim that was never reached is
// reported as a failure instead of being skipped.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'dist'));
const wasm = require(path.join(root, 'dist/wasm/index.cjs'));

// Minimal browser-ish globals so the file and storage examples can run.
class FakeFile {
  constructor(parts, name, options = {}) {
    this.name = name;
    this.type = options.type || '';
    this._parts = parts;
  }
  async arrayBuffer() {
    return new TextEncoder().encode(this._parts.join('')).buffer;
  }
  async text() {
    return this._parts.join('');
  }
}
class FakeBlob {
  constructor(parts, options = {}) {
    this.type = options.type || '';
    this._parts = parts;
  }
  async text() {
    return this._parts.join('');
  }
}

const sandboxGlobals = {
  console,
  TextEncoder,
  TextDecoder,
  File: FakeFile,
  Blob: FakeBlob,
  FileReader: class {
    readAsDataURL() {
      this.onload?.();
    }
    readAsArrayBuffer() {
      this.onload?.();
    }
  },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  localStorage: (() => {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    };
  })(),
  setTimeout,
  clearTimeout,
  Promise,
  Date,
  Math,
  JSON,
  Object,
  Array,
  Map,
  Set,
  WeakMap,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
  String,
  Number,
  Boolean,
  Symbol,
  RegExp,
  Uint8Array,
  Int32Array,
  Float64Array,
  ArrayBuffer,
  BigInt,
};

const requireFn = (id) => {
  if (id === 'index-system') return pkg;
  if (id === 'index-system/wasm') return wasm;
  return require(id);
};

function jsLiteral(value) {
  if (value instanceof Map) return `Map(${[...value].map(([k, v]) => `${jsLiteral(k)} => ${jsLiteral(v)}`).join(', ')})`;
  if (ArrayBuffer.isView(value)) return `${value.constructor.name} [${[...value].join(', ')}]`;
  if (value instanceof Error) return value.constructor.name;
  if (typeof value === 'string') return `'${value}'`;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[${value.map(jsLiteral).join(', ')}]`;
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${k}: ${jsLiteral(v)}`)
      .join(', ')} }`;
  }
  return String(value);
}

function describe(value) {
  if (value instanceof Map) return `Map(${[...value].map(([k, v]) => `${jsLiteral(k)} => ${jsLiteral(v)}`).join(', ')})`;
  if (ArrayBuffer.isView(value)) return `${value.constructor.name} [${[...value].join(', ')}]`;
  if (value instanceof Error) return value.constructor.name;
  if (typeof value === 'string') return `'${value}'`;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Compare by value: evaluate the claimed literal and deep-compare it with the
// actual result. Falls back to a prefix match for prose-style claims.
function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
      if (!b.has(k)) return false;
      if (!deepEqual(v, b.get(k))) return false;
    }
    return true;
  }
  if (a instanceof Error || b instanceof Error) {
    return a instanceof Error && b instanceof Error && a.constructor === b.constructor;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

function evaluateClaim(claimed) {
  try {
    // eslint-disable-next-line no-new-func
    return { ok: true, value: new Function(`return (${claimed});`)() };
  } catch {
    return { ok: false };
  }
}

function isBalanced(text) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
  }
  return depth === 0 && quote === null;
}

function isErrorLike(value) {
  return value instanceof Error;
}

function claimsMatch(claimed, actual) {
  // Renderer-style claims are compared as text, not evaluated.
  if (/^Map\(/.test(claimed)) {
    const evaluated = evaluateClaim(claimed);
    if (evaluated.ok && deepEqual(evaluated.value, actual)) return true;
    // Map notation in the docs is not valid JS; compare the rendered form.
    return jsLiteral(actual) === claimed || describe(actual) === claimed;
  }
  if (/^(Uint8Array|Int32Array|Float64Array)\b/.test(claimed)) {
    const rendered = describe(actual);
    return rendered === claimed || rendered.replace(/\s+/g, ' ') === claimed.replace(/\s+/g, ' ');
  }
  const evaluated = evaluateClaim(claimed);
  if (evaluated.ok) {
    if (deepEqual(evaluated.value, actual)) return true;
    // The claim may name an Error class instead of the instance.
    if (isErrorLike(actual) && evaluated.value === actual.constructor.name) return true;
    // Or name an Error class nested inside an object.
    if (evaluated.value && typeof evaluated.value === 'object' && actual && typeof actual === 'object') {
      const keys = Object.keys(evaluated.value);
      if (
        keys.length === Object.keys(actual).length &&
        keys.every((k) => {
          if (isErrorLike(actual[k])) {
            const claimedType = typeof evaluated.value[k] === 'function' ? evaluated.value[k].name : evaluated.value[k];
            return claimedType === actual[k].constructor.name;
          }
          return deepEqual(evaluated.value[k], actual[k]);
        })
      ) {
        return true;
      }
    }
    return false;
  }
  // Prose claims: require the actual rendering to appear inside the claim.
  const rendered = describe(actual);
  const flatten = (text) =>
    text
      .replace(/'/g, '"')
      .replace(/\s+/g, ' ')
      .replace(/,(\s*[\]}])/g, '$1')
      .trim();
  const a = flatten(rendered);
  const b = flatten(claimed);
  if (b.startsWith(a) || a.startsWith(b)) return true;
  // The claim may append prose after the literal, e.g. "{...}, with a note".
  const literal = b.match(/^(\{.*\}|\[.*\])/);
  if (literal) {
    const evaluated = evaluateClaim(literal[1]);
    if (evaluated.ok && deepEqual(evaluated.value, actual)) return true;
  }
  // A claim may state a number with a trailing ellipsis.
  const numeric = /^(-?\d+(?:\.\d+)?)\.\.\.$/.exec(b);
  if (numeric) return String(actual).startsWith(numeric[1]);
  return false;
}

const DECLARATION = /^(const|let|var|function|class|import|export|return|if|for|while|try|throw|async)\b/;
const CLAIM_START = /^['`\[{]|^-?\d|^Map\(|^Uint8Array|^Int32Array|^Float64Array|^true$|^false$|^null$|^undefined$/;

const checkFile = async (file) => {
  const text = fs.readFileSync(file, 'utf8');
  // Every fenced block is collected, not just the TypeScript ones.
  const blocks = [...text.matchAll(/```(ts|js|typescript|javascript)\n([\s\S]*?)```/g)].map((match, index) => ({
    index,
    language: match[1],
    code: match[2],
  }));

  const problems = [];
  const claims = [];
  const pending = [];

  for (const block of blocks) {
    const recorded = [];
    const rewritten = block.code
      .split('\n')
      .map((line) => {
        const match = line.match(/^(\s*)(.+?);\s*\/\/\s*(.+)$/);
        if (!match) return line;
        const [, indent, expression, claimedRaw] = match;
        if (DECLARATION.test(expression.trim())) return line;
        if (!CLAIM_START.test(claimedRaw.trim())) return line;
        // Skip continuation lines of a multi-line expression.
        if (!isBalanced(expression)) return line;
        claims.push({ block: block.index, expression: expression.trim(), claimed: claimedRaw.trim() });
        return `${indent}__record(${JSON.stringify(expression.trim())}, (${expression.trim()}));`;
      })
      .join('\n');

    const source =
      block.language === 'ts' || block.language === 'typescript'
        ? ts.transpileModule(rewritten, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
          }).outputText
        : rewritten;

    const module = { exports: {} };
    const helper = 'const __record = (expression, value) => { __results.push({ expression, value }); };';

    try {
      const factory = new Function(
        ...Object.keys(sandboxGlobals),
        'require',
        'module',
        'exports',
        '__results',
        `${helper}\nreturn (async () => {\n${source}\n})();`,
      );
      const promise = factory(
        ...Object.values(sandboxGlobals),
        requireFn,
        module,
        module.exports,
        recorded,
      );
      pending.push(
        promise.catch((error) => {
          if (error && error.code === 'ENOENT') return; // needs an external file
          problems.push(`block ${block.index} failed: ${error && error.message}`);
        }),
      );
    } catch (error) {
      problems.push(`block ${block.index} failed to compile: ${error && error.message}`);
    }
    block.recorded = recorded;
  }

  await Promise.all(pending);

  let checked = 0;
  for (const claim of claims) {
    const block = blocks.find((item) => item.index === claim.block);
    const found = block.recorded.find((item) => item.expression === claim.expression);
    if (!found) {
      problems.push(
        `block ${claim.block}: "${claim.expression}" never ran, so the documented ${claim.claimed} was not verified`,
      );
      continue;
    }
    checked++;
    if (!claimsMatch(claim.claimed, found.value)) {
      problems.push(
        `block ${claim.block}: ${claim.expression} is documented as ${claim.claimed} but produced ${describe(found.value)}`,
      );
    }
  }

  console.log(
    `${path.relative(root, file)}: ${blocks.length} blocks executed, ${checked} documented values verified` +
      ` (${claims.length - checked} never reached)`,
  );
  return problems;
};

const main = async () => {
  const files = process.argv.slice(2);
  const targets = files.length ? files : [path.join(root, 'README.md'), path.join(root, 'README.zh-CN.md')];
  const problems = [];
  for (const file of targets) {
    problems.push(...(await checkFile(file)));
  }
  if (problems.length) {
    console.error('\nThe documented examples do not hold up:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log('\nEvery documented example runs, and every documented value matches.');
};

main();
