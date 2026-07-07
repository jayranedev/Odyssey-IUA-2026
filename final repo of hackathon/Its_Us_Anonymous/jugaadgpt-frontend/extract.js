const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\jayra\\.gemini\\antigravity\\brain\\2942ff19-b472-40fe-9fd0-9b9d8ad622b5\\.system_generated\\logs\\overview.txt';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.source === 'SYSTEM_OUTPUT' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'view_file' && call.output) {
          const match = call.output.match(/File Path: `file:\/\/\/([A-Za-z]:\/[^`]+)`[\s\S]*?Showing lines 1 to \d+\s*(?:The following code.*?:\s*)?([\s\S]+?)(?=\n\n(?:The above content shows|There are \d+ more lines)|$)/i);
          if (match) {
            const filePath = match[1].replace(/\//g, '\\');
            const fileContentRaw = match[2];
            // Remove line numbers: "1: "
            const contentLines = fileContentRaw.split('\n').map(l => {
              const idx = l.indexOf(': ');
              return idx !== -1 ? l.substring(idx + 2) : l;
            }).join('\n');
            
            const fileName = path.basename(filePath);
            console.log('Found:', fileName);
            fs.writeFileSync(fileName, contentLines);
          }
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
}
