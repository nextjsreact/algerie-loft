/**
 * Console Ninja Output Filter
 * 
 * This utility filters out obfuscated Console Ninja code patterns from development server output
 * to provide clean, readable logs for debugging.
 * 
 * Patterns filtered:
 * - oo_oo(...) function calls
 * - oo_tx(...) function calls  
 * - oo_cm(...) function calls
 * - Other Console Ninja obfuscated patterns
 */

import { Transform } from 'stream';

class ConsoleNinjaFilter {
  constructor() {
    // Regex patterns to match Console Ninja obfuscated code
    this.patterns = [
      // Match oo_oo function calls with any parameters
      /console\.log\(\.\.\.oo_oo\([^)]*\),[^)]*\)\)/g,
      /oo_oo\([^)]*\)/g,
      
      // Match other Console Ninja patterns
      /oo_tx\([^)]*\)/g,
      /oo_cm\([^)]*\)/g,
      
      // Match Console Ninja specific comments and markers
      /\/\* eslint-disable \*\/console\.log\(\.\.\.oo_oo[^)]*\)/g,
      
      // Match Console Ninja connection messages
      /✔ Console Ninja extension is connected to Next\.js.*/g,
      /⚠ Console Ninja Turbopack support is a PRO feature.*/g,
      
      // Match lines that are primarily obfuscated code
      /^\s*\/\* eslint-disable \*\/console\.log\(\.\.\.oo_oo.*$/gm,
    ];
    
    // Replacement patterns for cleaner output
    this.replacements = [
      // Replace obfuscated console.log calls with clean versions
      {
        pattern: /\/\* eslint-disable \*\/console\.log\(\.\.\.oo_oo\([^)]*\),\s*([^)]+)\)\)/g,
        replacement: 'console.log($1)'
      }
    ];
  }

  /**
   * Filter a single line of output
   * @param {string} line - The line to filter
   * @returns {string|null} - Filtered line or null if line should be removed
   */
  filterLine(line) {
    // Check if line contains only obfuscated code patterns
    const hasOnlyObfuscatedCode = this.patterns.some(pattern => {
      const matches = line.match(pattern);
      return matches && matches.join('').length > line.trim().length * 0.7;
    });
    
    if (hasOnlyObfuscatedCode) {
      return null; // Remove the line entirely
    }
    
    // Apply replacements to clean up the line
    let cleanedLine = line;
    for (const replacement of this.replacements) {
      cleanedLine = cleanedLine.replace(replacement.pattern, replacement.replacement);
    }
    
    // Remove remaining obfuscated patterns
    for (const pattern of this.patterns) {
      cleanedLine = cleanedLine.replace(pattern, '');
    }
    
    // Clean up extra whitespace
    cleanedLine = cleanedLine.replace(/\s+/g, ' ').trim();
    
    // Return null for empty lines after cleaning
    return cleanedLine.length > 0 ? cleanedLine : null;
  }

  /**
   * Filter multiple lines of output
   * @param {string} output - The output to filter
   * @returns {string} - Filtered output
   */
  filterOutput(output) {
    const lines = output.split('\n');
    const filteredLines = lines
      .map(line => this.filterLine(line))
      .filter(line => line !== null);
    
    return filteredLines.join('\n');
  }

  /**
   * Create a stream transformer for real-time filtering
   * @returns {Transform} - Node.js Transform stream
   */
  createStreamFilter() {
    const filter = this;
    
    return new Transform({
      transform(chunk, encoding, callback) {
        const output = chunk.toString();
        const filtered = filter.filterOutput(output);
        callback(null, filtered);
      }
    });
  }
}

export default ConsoleNinjaFilter;