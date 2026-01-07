// #region agent log
const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, '.cursor', 'debug.log');
const logEntry = {
  sessionId: 'debug-session',
  runId: 'post-fix',
  hypothesisId: 'A',
  location: 'postcss.config.js:1',
  message: 'PostCSS config loaded',
  data: {
    plugins: ['@tailwindcss/postcss', 'autoprefixer'],
    configType: 'v4-syntax'
  },
  timestamp: Date.now()
};
try {
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
} catch (e) {}
// #endregion

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
