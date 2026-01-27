# 배포 가이드

이 문서는 AWS EC2에서 Docker를 사용하여 애플리케이션을 배포하는 방법을 설명합니다.

## 사전 준비

### 1. Docker Hub 계정 설정

1. [Docker Hub](https://hub.docker.com/)에서 계정 생성
2. GitHub 저장소에 Secrets 추가:
   - **Settings** → **Secrets and variables** → **Actions**
   - 다음 Secrets 추가:
     - `DOCKER_USERNAME`: Docker Hub 사용자명
     - `DOCKER_PASSWORD`: Docker Hub 비밀번호 또는 Access Token

### 2. AWS EC2 인스턴스 준비

- Ubuntu 20.04 이상 권장
- 최소 사양: 1GB RAM, 1 vCPU
- 보안 그룹에서 포트 3000 (또는 사용할 포트) 열기

## EC2 인스턴스 설정

### 1. Docker 설치

```bash
# 패키지 업데이트
sudo apt-get update

# Docker 설치
sudo apt-get install -y docker.io

# Docker 서비스 시작 및 자동 시작 설정
sudo systemctl start docker
sudo systemctl enable docker

# 현재 사용자를 docker 그룹에 추가 (sudo 없이 docker 사용)
sudo usermod -aG docker $USER

# 재로그인 필요
```

### 2. Docker Compose 설치 (선택사항, 권장)

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 배포 방법

### 방법 1: Docker 명령어로 직접 실행

```bash
# Docker Hub에서 이미지 pull
docker pull <DOCKER_USERNAME>/crew:latest

# 환경 변수 파일 생성
cat > .env << EOF
PORT=3000
JWT_SECRET=your-production-secret-key-here
EOF

# 컨테이너 실행
docker run -d \
  --name crew-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  <DOCKER_USERNAME>/crew:latest
```

### 방법 2: Docker Compose 사용 (권장)

#### docker-compose.yml 파일 생성

```yaml
version: '3.8'

services:
  crew:
    image: <DOCKER_USERNAME>/crew:latest
    container_name: crew-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./crew.db:/app/crew.db  # 데이터베이스 파일 영구 저장
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

#### 배포 스크립트 (deploy.sh)

```bash
#!/bin/bash

# 환경 변수 설정
DOCKER_USERNAME="your-docker-username"
IMAGE_NAME="crew"
IMAGE_TAG="latest"

# .env 파일 확인
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# 기존 컨테이너 중지 및 제거
docker-compose down

# 최신 이미지 pull
docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

# 새 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

#### 실행

```bash
# 스크립트에 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

## 자동 배포 설정 (선택사항)

### GitHub Actions를 통한 자동 배포

EC2 인스턴스에 SSH 접속하여 자동으로 배포하려면:

1. **EC2에 SSH 키 설정**
   - GitHub Secrets에 `EC2_SSH_KEY` 추가 (SSH private key)
   - GitHub Secrets에 `EC2_HOST` 추가 (EC2 인스턴스 IP 또는 도메인)
   - GitHub Secrets에 `EC2_USER` 추가 (보통 `ubuntu`)

2. **CD 워크플로우에 배포 단계 추가**

`.github/workflows/cd.yml`에 다음 단계 추가:

```yaml
- name: Deploy to EC2
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USER }}
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      cd /path/to/deployment
      docker pull ${{ secrets.DOCKER_USERNAME }}/crew:latest
      docker-compose down
      docker-compose up -d
```

## 모니터링 및 관리

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker ps

# 로그 확인
docker logs crew-app
docker logs -f crew-app  # 실시간 로그

# 컨테이너 재시작
docker restart crew-app

# 컨테이너 중지
docker stop crew-app

# 컨테이너 시작
docker start crew-app
```

### 데이터베이스 백업

```bash
# SQLite 데이터베이스 백업
docker cp crew-app:/app/crew.db ./crew-backup-$(date +%Y%m%d).db
```

### 로그 관리

```bash
# Docker 로그 크기 제한 설정 (docker-compose.yml에 추가)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep 3000

# 다른 포트로 변경하거나 기존 프로세스 종료
```

### 컨테이너가 계속 재시작되는 경우

```bash
# 로그 확인
docker logs crew-app

# 환경 변수 확인
docker exec crew-app env
```

### 이미지 업데이트

```bash
# 최신 이미지 pull
docker pull <DOCKER_USERNAME>/crew:latest

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

## 보안 권장사항

1. **환경 변수 보호**
   - `.env` 파일을 안전하게 관리
   - 프로덕션 JWT_SECRET은 강력한 랜덤 문자열 사용

2. **방화벽 설정**
   - 필요한 포트만 열기
   - SSH는 특정 IP에서만 접근 허용

3. **HTTPS 설정**
   - Nginx나 다른 리버스 프록시 사용
   - Let's Encrypt로 SSL 인증서 발급

4. **정기 업데이트**
   - Docker 이미지 정기적으로 업데이트
   - 보안 패치 적용
