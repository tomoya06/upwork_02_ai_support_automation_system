#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel', 'npm', 'pnpm', 'yarn']);
function log(msg) { console.error(msg); }
function commandExists(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) throw new Error(`Not in whitelist: ${cmd}`);
  try {
    if (isWindows) { const r = spawnSync('where', [cmd], { stdio: 'ignore' }); return r.status === 0; }
    else { const r = spawnSync('sh', ['-c', `command -v "$1"`, '--', cmd], { stdio: 'ignore' }); return r.status === 0; }
  } catch { return false; }
}
function getCommandOutput(cmd, args) {
  try {
    const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: isWindows });
    return r.status === 0 ? (r.stdout || '').trim() : null;
  } catch { return null; }
}
function parseArgs(args) {
  const result = { projectPath: '.', prod: true, yes: false, skipBuild: false };
  for (const arg of args) {
    if (arg === '--prod') result.prod = true;
    else if (arg === '--yes' || arg === '-y') result.yes = true;
    else if (arg === '--skip-build') result.skipBuild = true;
    else if (!arg.startsWith('-')) result.projectPath = arg;
  }
  return result;
}
function checkVercelInstalled() {
  if (!commandExists('vercel')) { log('Error: Vercel CLI not installed'); process.exit(1); }
  log(`Vercel CLI: ${getCommandOutput('vercel', ['--version']) || 'unknown'}`);
}
function checkLoginStatus() {
  try {
    const r = spawnSync('vercel', ['whoami'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: isWindows });
    const output = (r.stdout || '').trim();
    if (r.status === 0 && output && !output.includes('Error')) { log(`Logged in as: ${output}`); return true; }
  } catch {}
  return false;
}
function checkProject(projectPath) {
  const absPath = path.resolve(projectPath);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) { log(`Error: Not a directory: ${absPath}`); process.exit(1); }
  log(`Project path: ${absPath}`);
  return absPath;
}
function detectPackageManager(projectPath) {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
  if (commandExists('npm')) return 'npm';
  return null;
}
function runBuildIfNeeded(projectPath) {
  const pkgJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) { log('No package.json, skipping build'); return; }
  let pkg;
  try { pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')); } catch { return; }
  if (!pkg.scripts || !pkg.scripts.build) { log('No build script, skipping build'); return; }
  const pkgManager = detectPackageManager(projectPath);
  if (!pkgManager) { log('Error: No package manager'); process.exit(1); }
  log(`\n=== Running build with ${pkgManager} ===\n`);
  const buildArgs = pkgManager === 'npm' ? ['run', 'build'] : ['build'];
  try {
    const r = spawnSync(pkgManager, buildArgs, { cwd: projectPath, stdio: 'inherit', shell: isWindows });
    if (r.status !== 0) throw new Error('Build failed');
    log('\n=== Build successful ===\n');
  } catch { log('\nBuild FAILED. Fix errors before deploying.'); process.exit(1); }
}
function doDeploy(projectPath, options) {
  log('\n=== Starting Vercel deployment ===\n');
  const args = [];
  if (options.yes) args.push('--yes');
  if (options.prod) { args.push('--prod'); log('Environment: Production'); }
  log(`Command: vercel ${args.join(' ')}\n`);
  try {
    const r = spawnSync('vercel', args, { cwd: projectPath, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], timeout: 300000, shell: isWindows });
    const output = (r.stdout || '') + (r.stderr || '');
    log(output);
    if (r.status !== 0) throw new Error('Deployment failed');
    const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const productionMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const finalUrl = (aliasedMatch && aliasedMatch[1]) || (productionMatch && productionMatch[1]);
    log('\n=== Deployment successful! ===\n');
    if (finalUrl) { log(`Live URL: ${finalUrl}`); console.log(JSON.stringify({ status: 'success', url: finalUrl })); }
    else console.log(JSON.stringify({ status: 'success' }));
  } catch (e) { log(e.message || ''); log('Deployment failed'); process.exit(1); }
}
function main() {
  log('=== Vercel CLI Deployment ===\n');
  const options = parseArgs(process.argv.slice(2));
  checkVercelInstalled();
  if (!checkLoginStatus()) { log('Error: Not logged in'); process.exit(1); }
  const projectPath = checkProject(options.projectPath);
  if (!options.skipBuild) runBuildIfNeeded(projectPath);
  doDeploy(projectPath, options);
}
main();
