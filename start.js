const { exec } = require('child_process');

// Start the server
const serverProcess = exec('node server.js', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error starting server: ${error.message}`);
    }
    if (stderr) {
        console.error(`Server stderr: ${stderr}`);
    }
    console.log(`Server output: ${stdout}`);
});

// Use open-cli directly (this is a command, not a require)
exec('npx open-cli http://localhost:3000', (error) => {
    if (error) {
        console.error(`Failed to open browser: ${error.message}`);
    }
});

// Optional: Clean shutdown
process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit();
});
