#!/usr/bin/env node

/**
 * Performance Metrics Analyzer
 * Tracks code performance over time and identifies optimization opportunities
 */

const fs = require('fs');
const path = require('path');

class PerformanceMetrics {
  constructor() {
    this.metricsFile = '.metrics.json';
    this.metrics = this.loadMetrics();
  }

  loadMetrics() {
    if (fs.existsSync(this.metricsFile)) {
      return JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    }
    return { history: [], summary: {} };
  }

  saveMetrics() {
    fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
  }

  analyzeCodeComplexity(dir = 'src') {
    const metrics = {
      totalFiles: 0,
      totalLines: 0,
      avgLinesPerFile: 0,
      largeFiles: [],
      timestamp: new Date().toISOString(),
    };

    const files = this.getAllFiles(dir);
    metrics.totalFiles = files.length;

    files.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      metrics.totalLines += lines;

      if (lines > 300) {
        metrics.largeFiles.push({ file, lines });
      }
    });

    metrics.avgLinesPerFile = Math.round(metrics.totalLines / metrics.totalFiles);
    return metrics;
  }

  getAllFiles(dir, ext = '.js') {
    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach((item) => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.')) {
        files.push(...this.getAllFiles(fullPath, ext));
      } else if (item.name.endsWith(ext)) {
        files.push(fullPath);
      }
    });

    return files;
  }

  generateReport() {
    console.log('\n=== Performance Metrics Report ===\n');

    const complexity = this.analyzeCodeComplexity();
    console.log(`Total Files: ${complexity.totalFiles}`);
    console.log(`Total Lines: ${complexity.totalLines}`);
    console.log(`Avg Lines/File: ${complexity.avgLinesPerFile}`);

    if (complexity.largeFiles.length > 0) {
      console.log(`\nFiles Over 300 Lines (Refactoring Candidates):`);
      complexity.largeFiles.forEach((f) => {
        console.log(`  - ${f.file}: ${f.lines} lines`);
      });
    }

    this.metrics.history.push(complexity);
    this.metrics.summary = complexity;
    this.saveMetrics();

    console.log('\n=== Recommendations ===');
    console.log('1. Break down large files into smaller, focused modules');
    console.log('2. Use caching and memoization for expensive operations');
    console.log('3. Profile hot paths with Node.js --prof flag');
    console.log('4. Consider algorithmic optimizations for data structures');
    console.log('\n');
  }
}

const analyzer = new PerformanceMetrics();
analyzer.generateReport();

module.exports = PerformanceMetrics;
