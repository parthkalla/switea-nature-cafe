const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function getUnsplashPhotoUrl(photoId) {
  return new Promise((resolve, reject) => {
    https.get(`https://unsplash.com/photos/${photoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-_]+/g);
        if (matches && matches.length > 0) {
          resolve(matches[0]);
        } else {
          reject(new Error('No image url found in html'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching garlic bread image...');
  try {
    const imgUrl = await getUnsplashPhotoUrl('cC0_UO1Obg4');
    console.log('Unsplash Image URL:', imgUrl);
    const downloadUrl = `${imgUrl}?w=800&auto=format&fit=crop&q=80`;
    const targetFile = path.join(__dirname, '../public/images/dishes/paneer_garlic_bread.jpg');
    await download(downloadUrl, targetFile);
    console.log('Successfully saved to:', targetFile);
  } catch (err) {
    console.error('Error fetching garlic bread:', err.message);
  }
}

main();
