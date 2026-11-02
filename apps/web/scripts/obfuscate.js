const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const CHUNKS_DIR = path.join(__dirname, '..', '.next', 'static', 'chunks');

const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: false, // Prevents Next.js webpack module scope collisions
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false, // Critical: keeps Next.js global module registrations intact
};

// Next.js bootstrap files that manage chunk loading and shouldn't have their symbols mutated
const EXCLUDE_PREFIXES = ['webpack-', 'polyfills-', 'framework-'];

function getAllJsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith('.js') && !file.endsWith('.map')) {
      const isExcluded = EXCLUDE_PREFIXES.some(prefix => file.startsWith(prefix));
      if (!isExcluded) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

console.log('[Obfuscator] Scanning .next/static/chunks for client JavaScript bundles...');
const files = getAllJsFiles(CHUNKS_DIR);
console.log(`[Obfuscator] Found ${files.length} chunk files to obfuscate.`);

let count = 0;
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    // Obfuscate
    const obfuscated = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_OPTIONS).getObfuscatedCode();
    fs.writeFileSync(file, obfuscated, 'utf8');
    count++;
  } catch (err) {
    console.warn(`[Obfuscator] Warning: could not obfuscate ${path.basename(file)}:`, err.message);
  }
}

console.log(`[Obfuscator] Successfully obfuscated ${count}/${files.length} client JavaScript chunks.`);
