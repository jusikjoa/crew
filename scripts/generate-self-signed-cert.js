/**
 * 자체 서명 인증서 생성 (Node.js - Windows/Linux/Mac 공통)
 * 사용: node scripts/generate-self-signed-cert.js
 */
const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.crt');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

(async () => {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = await selfsigned.generate(attrs, { days: 365, keySize: 2048 });

  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);

  console.log('생성 완료:', keyPath, certPath);
  console.log('.env에 USE_HTTPS=true, SSL_KEY_PATH=certs/server.key, SSL_CERT_PATH=certs/server.crt 설정 후 npm run dev 실행');
})();
