const { spawn } = require('child_process');

const child = spawn('vercel', ['env', 'add', 'STOCKAI_KEY_ENCRYPTION_SECRET', 'production'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

child.stdin.write('my_local_dev_encryption_secret_123!');
child.stdin.end();

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});
