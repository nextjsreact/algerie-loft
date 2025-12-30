#!/usr/bin/env node

/**
 * Clean Development Server with Console Ninja Filtering
 * 
 * This script starts the Next.js development server with real-time filtering
 * of Console Ninja obfuscated code patterns to provide clean, readable output.
 */

import { spawn } from 'child_process';
import path from 'path';
import ConsoleNinjaFilter from '../lib/utils/console-ninja-filter.js';

class CleanDevServer {
  constructor() {
    this.filter = new ConsoleNinjaFilter();
    this.serverProcess = null;
  }

  async start() {
    console.log('🚀 Starting Clean Development Server...');
    console.log('📋 Console Ninja filtering enabled');
    console.log('=' .repeat(60));

    // Set environment variables to minimize Console Ninja interference
    const env = {
      ...process.env,
      DISABLE_CONSOLE_NINJA: 'true',
      CONSOLE_NINJA_DISABLE: 'true',
      NODE_OPTIONS: '--no-warnings',
      NEXT_TELEMETRY_DISABLED: '1'
    };

    // Start the Next.js development server
    this.serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env
    });

    // Filter stdout
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      const filtered = this.filter.filterOutput(output);
      
      if (filtered.trim()) {
        process.stdout.write(filtered + '\n');
      }
    });

    // Filter stderr
    this.serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      const filtered = this.filter.filterOutput(output);
      
      if (filtered.trim()) {
        process.stderr.write(filtered + '\n');
      }
    });

    // Handle process events
    this.serverProcess.on('close', (code) => {
      console.log(`\n📋 Development server exited with code ${code}`);
    });

    this.serverProcess.on('error', (error) => {
      console.error('❌ Failed to start development server:', error);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      if (this.serverProcess) {
        this.serverProcess.kill('SIGINT');
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      if (this.serverProcess) {
        this.serverProcess.kill('SIGTERM');
      }
      process.exit(0);
    });
  }
}

// Start the clean development server
const server = new CleanDevServer();
server.start().catch(error => {
  console.error('❌ Error starting clean development server:', error);
  process.exit(1);
});