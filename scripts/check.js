const fs = require('fs');
for (const file of ['index.html', 'src/main.js', 'src/styles.css']) {
  if (!fs.existsSync(file)) throw new Error(`${file} is missing`);
}
const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('src/main.js')) throw new Error('index.html must load src/main.js');
console.log('Static app files are present.');
