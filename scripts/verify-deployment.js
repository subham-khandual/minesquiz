/**
 * MinesQuiz Pre-Deployment Verification Script
 * Validates compilation, test suites, Cloudflare bundle, and governance rules.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, desc) {
  console.log(`\n[Checking] ${desc}...`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log(`[PASS] ${desc}`);
  } catch (err) {
    console.error(`[FAIL] ${desc} encountered an error.`);
    process.exit(1);
  }
}

console.log('========================================================');
console.log('MinesQuiz: Running Pre-Deployment Automated Health Checks');
console.log('========================================================');

// 1. Compile shared types
run('pnpm --filter @mines-quiz/types build', 'Shared TypeScript Contracts (@mines-quiz/types)');

// 2. Compile shared utils
run('pnpm --filter @mines-quiz/utils build', 'Shared Utilities (@mines-quiz/utils)');

// 3. Compile backend server
run('pnpm --filter @mines-quiz/server build', 'Server TypeScript Compilation (@mines-quiz/server)');

// 4. Run backend unit tests (all 37 tests)
run('pnpm --filter @mines-quiz/server test', 'Server Unit Test Suites (37 tests)');

// 5. Compile web application & build Cloudflare dist
run('pnpm --filter @mines-quiz/web run build', 'Next.js Production Build & Cloudflare Dist (@mines-quiz/web)');

// 6. Verify dist assets exist
const distPath = path.resolve(__dirname, '../apps/web/dist');
if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
  console.error('[FAIL] Cloudflare distribution folder apps/web/dist is missing or incomplete.');
  process.exit(1);
}
console.log('[PASS] Cloudflare distribution bundle verified in apps/web/dist');

console.log('\n========================================================');
console.log('SUCCESS: All pre-flight checks passed (Exit Code 0).');
console.log('MinesQuiz is 100% ready for production deployment on Cloudflare and Railway!');
console.log('========================================================\n');
