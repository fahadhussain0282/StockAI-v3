const fetch = require('node-fetch');
const fs = require('fs');

async function test() {
  const payload = JSON.parse(fs.readFileSync('payload.json', 'utf8'));
  const res = await fetch('https://stockai-v3-one.vercel.app/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfYWRtaW5fZmFoYWRodXNzYWluMDI4MiIsImVtYWlsIjoiZmFoYWRodXNzYWluMDI4MkBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3ODU3NTYxNDUsImV4cCI6MTc4NTg0MjU0NX0.q-FT53a1bte4uDxXec8xnZcmjuhUmoNUF5TaYBOi7Hw',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log(res.status);
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
