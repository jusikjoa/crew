/**
 * HTTPS 동작 확인 스크립트
 * 사용: node scripts/verify-https.js (서버가 https://localhost:3000 에서 실행 중이어야 함)
 */
const https = require('https');

https
  .get(
    'https://localhost:3000/health-check',
    { rejectUnauthorized: false },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ HTTPS 정상 동작!', data.trim());
        } else {
          console.log('❌ 상태:', res.statusCode);
        }
      });
    }
  )
  .on('error', (e) => {
    console.error('❌ 연결 실패:', e.message);
    console.log('서버 실행: npm run dev');
    process.exit(1);
  });
