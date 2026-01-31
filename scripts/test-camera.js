const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:9002/api/hardware/camera';
const IMAGE_PATH = path.join(__dirname, '../public/car.jpg'); // Ensure you have a car.jpg in public or change this

async function testUpload() {
  console.log(`[TEST] Starting upload test...`);
  console.log(`[TEST] Target URL: ${API_URL}`);
  console.log(`[TEST] Image Path: ${IMAGE_PATH}`);

  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`[ERROR] Test image not found at ${IMAGE_PATH}. Please put a 'car.jpg' in the public folder to test.`);
    return;
  }

  const imageBuffer = fs.readFileSync(IMAGE_PATH);
  const base64Image = imageBuffer.toString('base64');
  const payload = JSON.stringify({ image: base64Image });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = http.request(API_URL, options, (res) => {
    console.log(`[TEST] Response Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`[TEST] Response Body: ${data}`);
      if (res.statusCode === 200) {
        console.log('[SUCCESS] API received the image!');
      } else {
        console.log('[FAILED] API returned an error.');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`[ERROR] Request failed: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

testUpload();
