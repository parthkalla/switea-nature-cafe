const https = require('https');
const fs = require('fs');

const url = 'https://www.eazydiner.com/jaipur/roastfuze-coffee-bar-vaishali-nagar-jaipur-708008/photos';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
    const matches = [...new Set(data.match(regex) || [])];
    const eazyImages = matches.filter(m => m.includes('eazydiner') || m.includes('cloudinary') || m.includes('cloudfront'));
    console.log(`Found ${eazyImages.length} images from EazyDiner:`);
    eazyImages.slice(0, 30).forEach((img, i) => console.log(`${i+1}: ${img}`));
    fs.writeFileSync('E:/roastfuze/eazydiner_photos.json', JSON.stringify(eazyImages, null, 2));
  });
}).on('error', err => console.error(err));
