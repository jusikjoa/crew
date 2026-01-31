# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 모든 의존성 설치 (빌드에 TypeScript 필요)
RUN npm ci && npm cache clean --force

# 모든 소스 파일 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# 프로덕션 스테이지
FROM node:20-alpine AS production

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# DB 마이그레이션 스크립트 복사
COPY scripts ./scripts

# 데이터 디렉토리 생성 (SQLite 데이터베이스용)
RUN mkdir -p /app/data && chmod 777 /app/data

# 포트 노출
EXPOSE 3000

# 환경 변수 설정 (기본값)
ENV NODE_ENV=production
ENV PORT=3000

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health-check', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 애플리케이션 실행
CMD ["node", "dist/main.js"]
