const https = require('https');
const fs = require('fs');

const url = 'https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,17z/data=!4m7!3m6!1s0x396db5fadc6985e1:0xec2fb39c9113ff9e!8m2!3d26.9056268!4d75.7271802!10e5!16s%2Fg%2F11xhbpgh0x';

const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /https:\/\/lh[35]\.googleusercontent\.com\/[a-zA-Z0-9_\-\/]+/g;
    const matches = [...new Set(data.match(regex) || [])];
    const filtered = matches.filter(m => m.length > 50 && !m.includes('/a/'));
    console.log(`Found ${filtered.length} photo URLs from Google Maps:`);
    filtered.slice(0, 25).forEach((u, i) => console.log(`${i + 1}: ${u}`));
    fs.writeFileSync('E:/roastfuze/maps_photos.json', JSON.stringify(filtered, null, 2));
  });
});
req.on('error', err => console.error(err));
