#!/usr/bin/env node
/**
 * Development server with Python warmup
 * This script runs the Python warmup before starting Next.js dev server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check for virtual environment Python
function getVirtualEnvPython() {
  const venvPaths = [
    path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'), // Windows
    path.join(process.cwd(), '.venv', 'bin', 'python'),         // Linux/Mac
    path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'),  // Alternative Windows
    path.join(process.cwd(), 'venv', 'bin', 'python')           // Alternative Linux/Mac
  ];

  for (const venvPath of venvPaths) {
    if (fs.existsSync(venvPath)) {
      return venvPath;
    }
  }
  
  return 'python'; // Fallback to system Python
}

async function runPythonWarmup() {
  const pythonExecutable = getVirtualEnvPython();
  const warmupScript = path.join(process.cwd(), 'automation_scripts', 'warmup.py');
  
  log('\n🔥 Starting Python warmup...', colors.yellow);
  log(`Using Python: ${pythonExecutable}`, colors.blue);
  
  return new Promise((resolve) => {
    const warmupProcess = spawn(pythonExecutable, [warmupScript], {
      cwd: process.cwd(),
      stdio: 'inherit' // This will show the warmup output directly
    });

    warmupProcess.on('close', (code) => {
      if (code === 0) {
        log('✅ Python warmup completed successfully!\n', colors.green);
      } else {
        log(`⚠️  Python warmup failed with code ${code}\n`, colors.red);
      }
      resolve();
    });

    warmupProcess.on('error', (error) => {
      log(`❌ Failed to start Python warmup: ${error.message}\n`, colors.red);
      resolve();
    });
  });
}

async function startNextDev() {
  log('🚀 Starting Next.js development server...', colors.blue);
  
  // Use 'npm' on Windows, 'npm' or 'node' on other platforms
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Check if turbo flag is requested
  const useTurbo = process.argv.includes('--turbo');
  const devCommand = useTurbo ? ['run', 'dev', '--', '--turbo'] : ['run', 'dev'];
  
  if (useTurbo) {
    log('⚡ Using Turbopack for faster compilation', colors.green);
  }
  
  const nextProcess = spawn(npm, devCommand, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('error', (error) => {
    log(`❌ Failed to start Next.js: ${error.message}`, colors.red);
    process.exit(1);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    log('\n👋 Shutting down...', colors.yellow);
    nextProcess.kill('SIGINT');
    process.exit(0);
  });
}

async function main() {
  log(`${colors.bright}🔧 AUTO Development Server with Python Warmup${colors.reset}\n`);
  
  // Run Python warmup first
  await runPythonWarmup();
  
  // Then start Next.js
  await startNextDev();
}

// Run the script
main().catch(error => {
  log(`❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});