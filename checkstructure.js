const fs = require('fs');
const path = require('path');

function printDirectoryStructure(dir, indent = '', exclude = ['node_modules', '.git']) {
    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
        if (exclude.includes(file)) return;

        const fullPath = path.join(dir, file);
        const isDirectory = fs.lstatSync(fullPath).isDirectory();
        const prefix = index === files.length - 1 ? '└── ' : '├── ';
        console.log(indent + prefix + file);

        if (isDirectory) {
            const newIndent = index === files.length - 1 ? '    ' : '│   ';
            printDirectoryStructure(fullPath, indent + newIndent, exclude);
        }
    });
}

// Start from the current directory
const rootDir = __dirname;
console.log(rootDir);
printDirectoryStructure(rootDir);
