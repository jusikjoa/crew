#!/bin/bash
# EC2에서 HTTPS 설정 (최초 1회 실행)
# 사용: ./scripts/setup-ec2-https.sh

set -e
DEPLOY_PATH="${1:-/home/ubuntu/crew}"
cd "${DEPLOY_PATH}"

echo "=== EC2 HTTPS 설정 ==="

# 1. certs 디렉터리 생성
mkdir -p certs
cd certs

# 2. 자체 서명 인증서 생성 (Let's Encrypt 사용 시 이 단계 스킵)
if [ ! -f server.key ] || [ ! -f server.crt ]; then
  echo "자체 서명 인증서 생성 중..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout server.key -out server.crt \
    -subj "/CN=localhost/O=Dev/C=KR"
  chmod 600 server.key
  echo "인증서 생성 완료"
else
  echo "인증서가 이미 존재합니다."
fi

cd ..

# 3. .env에 HTTPS 설정 추가
if ! grep -q "USE_HTTPS" .env 2>/dev/null; then
  echo "" >> .env
  echo "# HTTPS" >> .env
  echo "USE_HTTPS=true" >> .env
  echo "SSL_KEY_PATH=/app/certs/server.key" >> .env
  echo "SSL_CERT_PATH=/app/certs/server.crt" >> .env
  echo ".env에 HTTPS 설정 추가 완료"
else
  echo ".env에 USE_HTTPS가 이미 설정되어 있습니다."
fi

echo ""
echo "=== 설정 완료 ==="
echo "재시작: docker compose down && docker compose -f docker-compose.yml -f docker-compose.https.yml up -d"
echo "접속: https://<EC2_IP>/health-check"
echo ""
echo "docker-compose.https.yml이 없다면, main 브랜치 배포 후 자동으로 복사됩니다."
