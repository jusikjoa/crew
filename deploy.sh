#!/bin/bash

# 배포 스크립트
# 사용법: ./deploy.sh [DOCKER_USERNAME] [IMAGE_TAG]

set -e  # 에러 발생 시 스크립트 중단

# 변수 설정
DOCKER_USERNAME=${1:-${DOCKER_USERNAME:-your-username}}
IMAGE_NAME="crew"
IMAGE_TAG=${2:-${IMAGE_TAG:-latest}}
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=========================================="
echo "Crew 애플리케이션 배포 시작"
echo "=========================================="
echo "이미지: ${FULL_IMAGE_NAME}"
echo ""

# .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  경고: .env 파일이 없습니다."
    echo "기본 환경 변수를 사용합니다."
    echo ""
else
    echo "✅ .env 파일 확인됨"
fi

# 기존 컨테이너 중지 및 제거
echo "기존 컨테이너 확인 중..."
if [ "$(docker ps -aq -f name=crew-app)" ]; then
    echo "기존 컨테이너 중지 및 제거 중..."
    docker stop crew-app || true
    docker rm crew-app || true
    echo "✅ 기존 컨테이너 제거 완료"
else
    echo "실행 중인 컨테이너 없음"
fi

# 최신 이미지 pull
echo ""
echo "최신 이미지 다운로드 중..."
docker pull ${FULL_IMAGE_NAME}
echo "✅ 이미지 다운로드 완료"

# Docker Compose 사용 여부 확인
if [ -f docker-compose.yml ]; then
    echo ""
    echo "Docker Compose를 사용하여 배포합니다..."
    DOCKER_USERNAME=${DOCKER_USERNAME} docker compose up -d
    echo "✅ Docker Compose 배포 완료"
else
    echo ""
    echo "Docker 명령어로 배포합니다..."
    docker run -d \
        --name crew-app \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file .env \
        ${FULL_IMAGE_NAME}
    echo "✅ Docker 컨테이너 실행 완료"
fi

# 컨테이너 상태 확인
echo ""
echo "컨테이너 상태 확인 중..."
sleep 3
docker ps -f name=crew-app

echo ""
echo "=========================================="
echo "✅ 배포 완료!"
echo "=========================================="
echo "애플리케이션 로그 확인: docker logs -f crew-app"
echo "컨테이너 중지: docker stop crew-app"
echo "컨테이너 시작: docker start crew-app"
echo ""
