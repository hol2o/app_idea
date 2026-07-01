const fs = require('fs');
for (const file of ['index.html', 'src/main.js', 'src/styles.css']) {
  if (!fs.existsSync(file)) throw new Error(`${file} is missing`);
}
const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('src/main.js')) throw new Error('index.html must load src/main.js');
if (html.includes('type="module"')) throw new Error('index.html must load src/main.js as a classic script for older Chrome support');
if (!html.includes('boot-fallback')) throw new Error('index.html must include a visible loading fallback');
const js = fs.readFileSync('src/main.js', 'utf8');
if (js.includes('catch {')) throw new Error('src/main.js must not use optional catch binding because older Chrome versions may fail before rendering');
console.log('Static app files are present.');
