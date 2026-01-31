/**
 * HTTP/HTTPS 모두 지원하는 헬스체크
 * USE_HTTPS=true 이면 https, 아니면 http 사용
 */
const protocol = process.env.USE_HTTPS === 'true' ? require('https') : require('http');
const options = { rejectUnauthorized: false };

protocol
  .get(`${process.env.USE_HTTPS === 'true' ? 'https' : 'http'}://localhost:3000/health-check`, options, (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  })
  .on('error', () => process.exit(1));
