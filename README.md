# Crew - Slack-lite 서비스

Crew는 Slack과 유사한 기능을 제공하는 협업 메신저 서비스입니다. 사용자 관리, 채널 관리, 실시간 메시지 기능을 제공하는 백엔드 API 서버입니다.

## 🛠 기술 스택

### Backend Framework
- **NestJS** (v11.1.11) - Node.js 프레임워크
- **TypeScript** (v5.9.3) - 타입 안정성

### Database
- **SQLite** (v5.1.7) - 파일 기반 데이터베이스
- **TypeORM** (v0.3.28) - ORM

### Authentication
- **JWT** (JSON Web Tokens) - 토큰 기반 인증
- **Passport.js** - 인증 미들웨어
- **bcrypt** (v6.0.0) - 비밀번호 해싱

### Real-time Communication
- **Socket.IO** (v4.8.3) - WebSocket 통신
- **@nestjs/websockets** - NestJS WebSocket 모듈

### DevOps & Deployment
- **Docker** - 컨테이너화
- **Docker Compose** - 컨테이너 오케스트레이션
- **GitHub Actions** - CI/CD 파이프라인
- **AWS EC2** - 클라우드 서버

### Testing
- **Jest** (v30.2.0) - 테스트 프레임워크
- **ts-jest** - TypeScript Jest 설정


## 📁 프로젝트 구조

```
crew/
├── src/
│   ├── modules/
│   │   ├── auth/              # 인증 모듈
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/        # JWT Guard
│   │   │   ├── strategies/    # JWT Strategy
│   │   │   └── dto/           # SignupDto, LoginDto
│   │   ├── users/             # 사용자 관리 모듈
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/      # User Entity
│   │   │   └── dto/           # User DTOs
│   │   ├── channels/          # 채널 관리 모듈
│   │   │   ├── channels.controller.ts
│   │   │   ├── channels.service.ts
│   │   │   ├── entities/      # Channel Entity
│   │   │   └── dto/           # Channel DTOs
│   │   └── messages/          # 메시지 관리 모듈
│   │       ├── messages.controller.ts
│   │       ├── messages.service.ts
│   │       ├── messages.gateway.ts  # WebSocket Gateway
│   │       ├── entities/      # Message Entity
│   │       └── dto/           # Message DTOs
│   ├── app.module.ts          # 루트 모듈
│   └── main.ts                # 애플리케이션 진입점
├── .github/
│   └── workflows/
│       ├── ci.yml             # CI 파이프라인
│       └── cd.yml             # CD 파이프라인
├── Dockerfile                 # Docker 이미지 빌드 설정
├── docker-compose.yml         # Docker Compose 설정
├── package.json
└── README.md
```

## 🎯 주요 기능

### 1. 사용자 인증 및 관리
- ✅ 회원가입 (이메일, 사용자명, 비밀번호)
- ✅ 로그인 (JWT 토큰 발급)
- ✅ 사용자 프로필 관리
- ✅ 비밀번호 변경
- ✅ 계정 활성화/비활성화

### 2. 채널 관리
- ✅ 공개/비공개 채널 생성
- ✅ 비밀번호 보호 채널
- ✅ 채널 참여/탈퇴
- ✅ DM 채널 (1:1 대화)
- ✅ 채널 멤버 관리
- ✅ 채널 정보 수정/삭제

### 3. 메시지 기능
- ✅ 채널에 메시지 작성
- ✅ 채널별 메시지 조회
- ✅ 메시지 삭제 (작성자만)
- ✅ 실시간 메시지 알림 (WebSocket)

### 4. 실시간 통신 (WebSocket)
- ✅ Socket.IO 기반 실시간 통신
- ✅ 채널별 룸 관리
- ✅ JWT 인증 기반 연결
- ✅ 새 메시지 브로드캐스트
- ✅ 메시지 삭제 알림

## 🔌 API 엔드포인트 요약

### 인증 (Auth)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/auth/signup` | 회원가입 | ❌ |
| POST | `/auth/login` | 로그인 | ❌ |

### 사용자 (Users)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| GET | `/users` | 모든 사용자 조회 | ❌ |
| GET | `/users/:id` | 특정 사용자 조회 | ❌ |
| POST | `/users` | 사용자 생성 | ❌ |
| PATCH | `/users/:id` | 사용자 정보 수정 | ❌ |
| PATCH | `/users/:id/password` | 비밀번호 변경 | ❌ |
| PATCH | `/users/:id/activate` | 계정 활성화 | ❌ |
| PATCH | `/users/:id/deactivate` | 계정 비활성화 | ❌ |
| DELETE | `/users/:id` | 사용자 삭제 | ❌ |

### 채널 (Channels)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/channels` | 채널 생성 | ✅ |
| GET | `/channels` | 모든 채널 조회 (DM 제외) | ❌ |
| GET | `/channels/my-channels` | 내가 참여한 채널 | ✅ |
| GET | `/channels/:id` | 특정 채널 조회 | ❌ |
| GET | `/channels/:id/members` | 채널 멤버 목록 | ❌ |
| PATCH | `/channels/:id` | 채널 정보 수정 | ✅ |
| DELETE | `/channels/:id` | 채널 삭제 | ✅ |
| POST | `/channels/:id/join` | 채널 참여 | ✅ |
| POST | `/channels/:id/leave` | 채널 탈퇴 | ✅ |

### 메시지 (Messages)
| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/messages` | 메시지 생성 | ✅ |
| GET | `/messages` | 모든 메시지 조회 | ❌ |
| GET | `/messages/channel/:channelId` | 채널별 메시지 조회 | ✅ |
| DELETE | `/messages/:id` | 메시지 삭제 | ✅ |

> 📖 **상세한 API 처리 절차**는 [API_PROCESS_FLOW.md](./API_PROCESS_FLOW.md)를 참고하세요.

## 🔐 인증 및 권한

### JWT 인증
- 로그인 시 `accessToken` 발급
- 토큰은 `Authorization` 헤더에 `Bearer {token}` 형식으로 전송
- 토큰 만료 시간: 1일

### 권한 체크
- **채널 생성/수정/삭제**: 채널 생성자만 가능
- **채널 참여**: 
  - 공개 채널: 자유롭게 참여 가능
  - 비공개 채널: 비밀번호 필요
- **메시지 작성/조회**: 채널 멤버만 가능
- **메시지 삭제**: 메시지 작성자이면서 채널 멤버여야 함

## 💾 데이터베이스 구조

### Entity 관계
- **User ↔ Channel**: Many-to-Many (사용자는 여러 채널 참여 가능)
- **User ↔ Message**: One-to-Many (사용자는 여러 메시지 작성)
- **Channel ↔ Message**: One-to-Many (채널은 여러 메시지 보유)

### 주요 Entity 필드

#### User
- `id` (UUID)
- `email` (이메일, 유니크)
- `username` (사용자명, 유니크)
- `password` (해시된 비밀번호)
- `displayName` (표시명, 선택)
- `isActive` (계정 활성화 여부)

#### Channel
- `id` (UUID)
- `name` (채널명, 유니크)
- `description` (설명)
- `isPublic` (공개 여부)
- `password` (해시된 비밀번호, 선택)
- `isDM` (DM 채널 여부)
- `createdBy` (생성자 ID)
- `members` (멤버 목록, Many-to-Many)

#### Message
- `id` (UUID)
- `content` (메시지 내용)
- `authorId` (작성자 ID)
- `channelId` (채널 ID)
- `createdAt` (생성 시간)
- `updatedAt` (수정 시간)

## 🚀 CI/CD 파이프라인

### CI (Continuous Integration)
**파일**: `.github/workflows/ci.yml`

**트리거**:
- `main`, `develop`, `fix/**`, `feature/**` 브랜치에 push 시

**작업**:
1. **테스트** (Node.js 18.x, 20.x)
   - 의존성 설치 (`npm ci`)
   - 테스트 실행 (`npm test`)
   - 빌드 (`npm run build`)

2. **Lint & Type Check**
   - TypeScript 타입 체크 (`tsc --noEmit`)

### CD (Continuous Deployment)
**파일**: `.github/workflows/cd.yml`

**트리거**:
- `main` 브랜치에 push 시
- 수동 실행 (`workflow_dispatch`)

**작업**:
1. **Docker 이미지 빌드 및 푸시**
   - Docker Hub 로그인
   - 이미지 빌드
   - Docker Hub에 푸시 (`latest` 태그)

2. **EC2 자동 배포**
   - `docker-compose.yml` 파일 복사
   - 기존 컨테이너 중지
   - 기존 이미지 삭제 (강제 업데이트)
   - 최신 이미지 pull
   - 새 컨테이너 시작

**필요한 GitHub Secrets**:
- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_TOKEN`: Docker Hub Access Token
- `EC2_HOST`: EC2 인스턴스 IP 주소
- `EC2_USER`: EC2 사용자명 (보통 `ubuntu`)
- `EC2_SSH_KEY`: EC2 SSH 개인키
- `EC2_DEPLOY_PATH`: 배포 경로 (기본: `/home/ubuntu/crew`)
- `JWT_SECRET`: CI 테스트용 시크릿 키

## 🐳 Docker 설정

### Dockerfile
- **Multi-stage build** 사용
- **Builder stage**: TypeScript 컴파일
- **Production stage**: 프로덕션 실행 환경

### docker-compose.yml
```yaml
services:
  crew:
    image: ${DOCKER_USERNAME}/crew:latest
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - DATABASE_PATH=/app/data/crew.db
    volumes:
      - ./data:/app/data  # SQLite 데이터베이스 마운트
    healthcheck:
      test: ["CMD", "node", "-e", "..."]
```

## 🌐 배포 정보

### 배포 환경
- **서버**: AWS EC2
- **백엔드 URL**: `http://3.34.98.235:3000`
- **프론트엔드 URL**: `http://13.125.225.5:3001`

### CORS 설정
```typescript
app.enableCors({
  origin: true, // 모든 origin 허용 (개발 환경)
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 3600,
});
```

## ⚙️ 환경 변수

### 필수 환경 변수
```env
# 서버 포트
PORT=3000

# JWT 시크릿 키 (프로덕션에서는 반드시 변경)
JWT_SECRET=your-secret-key-change-in-production

# 데이터베이스 경로 (Docker 환경)
DATABASE_PATH=/app/data/crew.db
```

### GitHub Secrets (CI/CD용)
- `JWT_SECRET`: CI 테스트용 시크릿 키
- `DOCKER_USERNAME`: Docker Hub 사용자명
- `DOCKER_TOKEN`: Docker Hub Access Token
- `EC2_HOST`: EC2 인스턴스 IP
- `EC2_USER`: EC2 사용자명
- `EC2_SSH_KEY`: EC2 SSH 개인키
- `EC2_DEPLOY_PATH`: 배포 경로

## 🏃 실행 방법

### 로컬 개발 환경

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   PORT=3000
   JWT_SECRET=your-secret-key
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **테스트 실행**
   ```bash
   npm test
   ```

5. **빌드**
   ```bash
   npm run build
   ```

### Docker로 실행

1. **이미지 빌드**
   ```bash
   docker build -t crew:latest .
   ```

2. **컨테이너 실행**
   ```bash
   docker compose up -d
   ```

3. **로그 확인**
   ```bash
   docker logs crew-app
   ```

## 🔌 WebSocket 통신

### 연결 방법
```javascript
const socket = io('http://3.34.98.235:3000/messages', {
  query: { token: 'YOUR_JWT_TOKEN' }
});
```

### 주요 이벤트

#### 클라이언트 → 서버
- `joinChannel`: 채널 참여
  ```javascript
  socket.emit('joinChannel', { channelId: 'channel-id' });
  ```
- `leaveChannel`: 채널 나가기
  ```javascript
  socket.emit('leaveChannel', { channelId: 'channel-id' });
  ```

#### 서버 → 클라이언트
- `newMessage`: 새 메시지 알림
- `deletedMessage`: 메시지 삭제 알림
- `joinedChannel`: 채널 참여 성공
- `leftChannel`: 채널 나가기 성공
- `error`: 에러 발생

> 📖 자세한 내용은 [WEBSOCKET_GUIDE.md](./WEBSOCKET_GUIDE.md) 참고

## 🐛 트러블슈팅

### CORS 에러
**문제**: 프론트엔드에서 백엔드 API 호출 시 CORS 에러 발생

**해결**:
1. `main.ts`에서 CORS 설정 확인
2. 백엔드 서버 재시작
3. EC2 배포 시 최신 이미지로 업데이트 확인

### Docker 빌드 캐시 문제
**문제**: 코드 변경 후에도 Docker 이미지에 반영되지 않음

**해결**:
- CD 워크플로에서 레지스트리 캐시 제거
- EC2 배포 시 기존 이미지 삭제 후 새로 pull

### SQLite 권한 문제
**문제**: `SQLITE_CANTOPEN: unable to open database file`

**해결**:
- `data` 디렉토리 생성 및 권한 설정 (`chmod 777`)
- `docker-compose.yml`에서 볼륨 마운트 확인
- `DATABASE_PATH` 환경 변수 확인

## 📝 주요 특징

1. **모듈화된 아키텍처**: NestJS의 모듈 시스템 활용
2. **타입 안정성**: TypeScript로 타입 안정성 보장
3. **실시간 통신**: Socket.IO 기반 WebSocket 구현
4. **자동화된 배포**: GitHub Actions로 CI/CD 파이프라인 구축
5. **컨테이너화**: Docker로 배포 환경 일관성 유지
6. **테스트 커버리지**: Jest로 단위 테스트 작성

## 🔗 링크

- **GitHub Repository**: https://github.com/jusikjoa/crew
- **백엔드 API**: http://3.34.98.235:3000
- **프론트엔드**: http://13.125.225.5:3001

---

**마지막 업데이트**: 2026-01-27
