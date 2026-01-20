# WebSocket 통신 가이드

이 문서는 프론트엔드에서 Crew 서비스의 WebSocket 통신을 사용하는 방법을 설명합니다.

## 목차

1. [개요](#개요)
2. [연결 설정](#연결-설정)
3. [인증](#인증)
4. [채널 관리](#채널-관리)
5. [이벤트 목록](#이벤트-목록)
6. [예제 코드](#예제-코드)
7. [에러 처리](#에러-처리)

---

## 개요

Crew 서비스는 Socket.IO를 사용하여 실시간 메시지 통신을 제공합니다. WebSocket을 통해 다음과 같은 실시간 기능을 사용할 수 있습니다:

- ✅ 실시간 메시지 수신
- ✅ 메시지 삭제 알림
- ✅ 채널별 메시지 구독
- ✅ JWT 기반 인증

### WebSocket 엔드포인트

```
ws://localhost:3000/messages
```

프로덕션 환경에서는 환경 변수에서 포트를 확인하세요.

---

## 연결 설정

### 설치

#### JavaScript/TypeScript (Node.js)

```bash
npm install socket.io-client
```

#### React/Vue/Angular

```bash
npm install socket.io-client
# 또는
yarn add socket.io-client
```

### 기본 연결

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/messages', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('✅ WebSocket 연결 성공');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket 연결 끊김');
});

socket.on('connect_error', (error) => {
  console.error('연결 에러:', error);
});
```

---

## 인증

WebSocket 연결 시 JWT 토큰을 전달해야 합니다. 다음 세 가지 방법 중 하나를 사용할 수 있습니다:

### 방법 1: 쿼리 파라미터

```javascript
const socket = io('http://localhost:3000/messages', {
  query: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});
```

### 방법 2: Authorization 헤더

```javascript
const socket = io('http://localhost:3000/messages', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});
```

### 방법 3: auth 옵션 (Socket.IO v3+)

```javascript
const socket = io('http://localhost:3000/messages', {
  auth: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});
```

### 권장 방식

쿼리 파라미터 방식(`query`)이 가장 호환성이 좋으며 권장됩니다:

```javascript
// 로그인 후 토큰을 받아서 사용
const token = localStorage.getItem('accessToken'); // 또는 상태 관리에서 가져오기

const socket = io('http://localhost:3000/messages', {
  query: { token },
  transports: ['websocket', 'polling']
});
```

**⚠️ 주의**: 토큰이 없거나 만료된 경우 연결이 거부됩니다.

---

## 채널 관리

### 채널 참여 (구독)

특정 채널의 메시지를 받으려면 먼저 채널에 참여해야 합니다.

```javascript
// 채널 참여
socket.emit('joinChannel', {
  channelId: 'channel-id-here'
});

// 참여 성공 응답
socket.on('joinedChannel', (data) => {
  console.log('✅ 채널 참여 성공:', data.channelId);
  // data: { channelId: 'channel-id-here' }
});
```

### 채널 나가기 (구독 해제)

채널의 메시지를 더 이상 받지 않으려면 채널에서 나가야 합니다.

```javascript
// 채널 나가기
socket.emit('leaveChannel', {
  channelId: 'channel-id-here'
});

// 나가기 성공 응답
socket.on('leftChannel', (data) => {
  console.log('✅ 채널 나가기 성공:', data.channelId);
  // data: { channelId: 'channel-id-here' }
});
```

### 여러 채널 참여

동시에 여러 채널에 참여할 수 있습니다:

```javascript
const channelIds = ['channel-1', 'channel-2', 'channel-3'];

channelIds.forEach(channelId => {
  socket.emit('joinChannel', { channelId });
});
```

---

## 이벤트 목록

### 클라이언트 → 서버 (emit)

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `joinChannel` | `{ channelId: string }` | 채널에 참여하여 메시지 수신 시작 |
| `leaveChannel` | `{ channelId: string }` | 채널에서 나가서 메시지 수신 중지 |

### 서버 → 클라이언트 (on)

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `newMessage` | `MessageResponseDto` | 새 메시지가 생성되었을 때 |
| `deletedMessage` | `{ messageId: string, channelId: string }` | 메시지가 삭제되었을 때 |
| `joinedChannel` | `{ channelId: string }` | 채널 참여 성공 시 |
| `leftChannel` | `{ channelId: string }` | 채널 나가기 성공 시 |
| `error` | `{ message: string, error?: string }` | 에러 발생 시 |

### MessageResponseDto 구조

```typescript
interface MessageResponseDto {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  author?: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  channel?: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    isDM: boolean;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 예제 코드

### 1. React Hook 예제

```typescript
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: Date;
}

interface UseWebSocketProps {
  channelId: string | null;
  token: string | null;
}

export function useWebSocket({ channelId, token }: UseWebSocketProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      console.warn('토큰이 없어 WebSocket 연결을 시도하지 않습니다.');
      return;
    }

    // WebSocket 연결
    const socket = io('http://localhost:3000/messages', {
      query: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // 연결 성공
    socket.on('connect', () => {
      console.log('✅ WebSocket 연결 성공');
      setIsConnected(true);
    });

    // 연결 끊김
    socket.on('disconnect', () => {
      console.log('❌ WebSocket 연결 끊김');
      setIsConnected(false);
    });

    // 연결 에러
    socket.on('connect_error', (error) => {
      console.error('연결 에러:', error);
      setIsConnected(false);
    });

    // 새 메시지 수신
    socket.on('newMessage', (message: Message) => {
      console.log('새 메시지:', message);
      setMessages((prev) => {
        // 중복 체크
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // 메시지 삭제 알림
    socket.on('deletedMessage', ({ messageId }: { messageId: string }) => {
      console.log('메시지 삭제:', messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    // 에러 처리
    socket.on('error', ({ message }) => {
      console.error('WebSocket 에러:', message);
    });

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (channelId) {
        socket.emit('leaveChannel', { channelId });
      }
      socket.disconnect();
    };
  }, [token]);

  // 채널 변경 시 구독 업데이트
  useEffect(() => {
    if (!socketRef.current || !channelId || !isConnected) {
      return;
    }

    const socket = socketRef.current;

    // 이전 채널에서 나가기 (필요한 경우)
    // 현재는 여러 채널 동시 구독 가능

    // 새 채널 참여
    socket.emit('joinChannel', { channelId });

    socket.on('joinedChannel', ({ channelId: joinedChannelId }) => {
      console.log(`✅ 채널 ${joinedChannelId} 참여 성공`);
    });

    return () => {
      socket.emit('leaveChannel', { channelId });
    };
  }, [channelId, isConnected]);

  return {
    messages,
    isConnected,
    socket: socketRef.current,
  };
}

// 사용 예제
function ChatComponent({ channelId }: { channelId: string }) {
  const token = localStorage.getItem('accessToken');
  const { messages, isConnected } = useWebSocket({ channelId, token });

  return (
    <div>
      <div>연결 상태: {isConnected ? '✅ 연결됨' : '❌ 끊김'}</div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.author?.displayName || 'Unknown'}:</strong>
            {message.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Vue 3 Composition API 예제

```vue
<template>
  <div>
    <div>연결 상태: {{ isConnected ? '✅ 연결됨' : '❌ 끊김' }}</div>
    <div v-for="message in messages" :key="message.id">
      <strong>{{ message.author?.displayName || 'Unknown' }}:</strong>
      {{ message.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: Date;
}

const props = defineProps<{
  channelId: string;
  token: string;
}>();

const messages = ref<Message[]>([]);
const isConnected = ref(false);
let socket: Socket | null = null;

onMounted(() => {
  // WebSocket 연결
  socket = io('http://localhost:3000/messages', {
    query: { token: props.token },
    transports: ['websocket', 'polling'],
  });

  // 연결 이벤트
  socket.on('connect', () => {
    console.log('✅ WebSocket 연결 성공');
    isConnected.value = true;
    
    // 채널 참여
    socket?.emit('joinChannel', { channelId: props.channelId });
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket 연결 끊김');
    isConnected.value = false;
  });

  // 메시지 이벤트
  socket.on('newMessage', (message: Message) => {
    if (message.channelId === props.channelId) {
      messages.value.push(message);
    }
  });

  socket.on('deletedMessage', ({ messageId }: { messageId: string }) => {
    messages.value = messages.value.filter((m) => m.id !== messageId);
  });

  socket.on('joinedChannel', ({ channelId }) => {
    console.log(`✅ 채널 ${channelId} 참여 성공`);
  });

  socket.on('error', ({ message }) => {
    console.error('WebSocket 에러:', message);
  });
});

onUnmounted(() => {
  if (socket) {
    socket.emit('leaveChannel', { channelId: props.channelId });
    socket.disconnect();
  }
});

// 채널 변경 감지
watch(() => props.channelId, (newChannelId, oldChannelId) => {
  if (socket && isConnected.value) {
    if (oldChannelId) {
      socket.emit('leaveChannel', { channelId: oldChannelId });
    }
    socket.emit('joinChannel', { channelId: newChannelId });
  }
});
</script>
```

### 3. 순수 JavaScript/TypeScript 예제

```typescript
import { io, Socket } from 'socket.io-client';

class ChatWebSocket {
  private socket: Socket | null = null;
  private token: string;
  private channelId: string | null = null;

  constructor(token: string) {
    this.token = token;
  }

  connect(): void {
    this.socket = io('http://localhost:3000/messages', {
      query: { token: this.token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket 연결 성공');
      
      if (this.channelId) {
        this.joinChannel(this.channelId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket 연결 끊김');
    });

    this.socket.on('newMessage', this.handleNewMessage.bind(this));
    this.socket.on('deletedMessage', this.handleDeletedMessage.bind(this));
    this.socket.on('error', this.handleError.bind(this));
  }

  joinChannel(channelId: string): void {
    if (!this.socket) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    this.channelId = channelId;
    this.socket.emit('joinChannel', { channelId });

    this.socket.once('joinedChannel', ({ channelId: joinedChannelId }) => {
      console.log(`✅ 채널 ${joinedChannelId} 참여 성공`);
    });
  }

  leaveChannel(channelId: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('leaveChannel', { channelId });
    this.channelId = null;

    this.socket.once('leftChannel', ({ channelId: leftChannelId }) => {
      console.log(`✅ 채널 ${leftChannelId} 나가기 성공`);
    });
  }

  onNewMessage(callback: (message: any) => void): void {
    if (!this.socket) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    this.socket.on('newMessage', callback);
  }

  onDeletedMessage(callback: (data: { messageId: string }) => void): void {
    if (!this.socket) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return;
    }

    this.socket.on('deletedMessage', callback);
  }

  private handleNewMessage(message: any): void {
    console.log('새 메시지:', message);
    // 여기에 메시지 처리 로직 추가
  }

  private handleDeletedMessage({ messageId }: { messageId: string }): void {
    console.log('메시지 삭제:', messageId);
    // 여기에 메시지 삭제 처리 로직 추가
  }

  private handleError({ message }: { message: string }): void {
    console.error('WebSocket 에러:', message);
  }

  disconnect(): void {
    if (this.socket) {
      if (this.channelId) {
        this.socket.emit('leaveChannel', { channelId: this.channelId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// 사용 예제
const chatWS = new ChatWebSocket('your-jwt-token');
chatWS.connect();

chatWS.onNewMessage((message) => {
  // 메시지 UI 업데이트
  console.log('새 메시지 수신:', message);
});

chatWS.joinChannel('channel-id-here');

// 채팅 종료 시
chatWS.disconnect();
```

---

## 에러 처리

### 일반적인 에러 상황

1. **토큰이 없거나 만료됨**
   ```javascript
   socket.on('connect_error', (error) => {
     if (error.message.includes('token') || error.message.includes('Unauthorized')) {
       // 토큰 갱신 또는 재로그인
       console.error('인증 에러: 토큰을 확인하세요.');
     }
   });
   ```

2. **채널 참여 실패**
   ```javascript
   socket.on('error', ({ message }) => {
     if (message.includes('채널')) {
       console.error('채널 참여 실패:', message);
     }
   });
   ```

3. **연결 끊김 처리**
   ```javascript
   socket.on('disconnect', (reason) => {
     if (reason === 'io server disconnect') {
       // 서버가 연결을 끊은 경우 (재연결 필요)
       socket.connect();
     }
     // 다른 경우는 자동으로 재연결 시도
   });
   ```

### 완전한 에러 처리 예제

```typescript
socket.on('connect_error', (error) => {
  console.error('연결 에러:', error);
  
  if (error.message.includes('token') || error.message.includes('Unauthorized')) {
    // 인증 에러: 토큰 갱신
    refreshToken()
      .then((newToken) => {
        socket.auth = { token: newToken };
        socket.connect();
      })
      .catch(() => {
        // 재로그인 필요
        window.location.href = '/login';
      });
  }
});

socket.on('error', ({ message, error }) => {
  console.error('WebSocket 에러:', message, error);
  
  // 사용자에게 알림 표시
  showNotification({
    type: 'error',
    message: message || '알 수 없는 에러가 발생했습니다.',
  });
});
```

---

## 모범 사례

### 1. 연결 상태 관리

```typescript
const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

socket.on('connect', () => {
  setConnectionStatus('connected');
});

socket.on('disconnect', () => {
  setConnectionStatus('disconnected');
});

socket.on('connect_error', () => {
  setConnectionStatus('disconnected');
});
```

### 2. 자동 재연결

Socket.IO는 기본적으로 자동 재연결을 지원합니다:

```javascript
const socket = io('http://localhost:3000/messages', {
  query: { token },
  reconnection: true,        // 자동 재연결 활성화
  reconnectionDelay: 1000,   // 1초 후 재연결 시도
  reconnectionDelayMax: 5000, // 최대 5초 대기
  reconnectionAttempts: 5,    // 최대 5회 시도
});
```

### 3. 메시지 중복 방지

```typescript
const receivedMessageIds = new Set<string>();

socket.on('newMessage', (message) => {
  if (receivedMessageIds.has(message.id)) {
    return; // 이미 수신한 메시지 무시
  }
  
  receivedMessageIds.add(message.id);
  addMessageToList(message);
});
```

### 4. 채널 전환 시 정리

```typescript
let currentChannelId: string | null = null;

function switchChannel(newChannelId: string) {
  if (currentChannelId && socket) {
    // 이전 채널에서 나가기
    socket.emit('leaveChannel', { channelId: currentChannelId });
    // 메시지 목록 초기화
    setMessages([]);
  }
  
  // 새 채널 참여
  currentChannelId = newChannelId;
  socket.emit('joinChannel', { channelId: newChannelId });
}
```

### 5. 성능 최적화

```typescript
// 메시지 목록이 너무 커지지 않도록 제한
const MAX_MESSAGES = 100;

socket.on('newMessage', (message) => {
  setMessages((prev) => {
    const updated = [...prev, message];
    // 최대 개수를 넘으면 오래된 메시지 제거
    if (updated.length > MAX_MESSAGES) {
      return updated.slice(-MAX_MESSAGES);
    }
    return updated;
  });
});
```

---

## 환경 변수 설정

프로덕션 환경에서는 환경 변수를 사용하세요:

```typescript
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000/messages';
// 또는
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000/messages';

const socket = io(WS_URL, {
  query: { token },
  transports: ['websocket', 'polling'],
});
```

---

## 문제 해결

### 연결이 안 될 때

1. **포트 확인**: 서버가 실행 중인지 확인
2. **토큰 확인**: JWT 토큰이 유효한지 확인
3. **CORS 확인**: 브라우저 콘솔에서 CORS 에러 확인
4. **네트워크 확인**: 방화벽이나 프록시 설정 확인

### 메시지를 받지 못할 때

1. **채널 참여 확인**: `joinChannel` 이벤트가 전송되었는지 확인
2. **채널 ID 확인**: 올바른 채널 ID를 사용했는지 확인
3. **서버 로그 확인**: 서버에서 브로드캐스트가 실행되었는지 확인

### 디버깅 팁

```javascript
// 모든 이벤트 로깅
socket.onAny((event, ...args) => {
  console.log('이벤트:', event, args);
});

// 연결 상태 모니터링
socket.on('connect', () => console.log('✅ 연결됨'));
socket.on('disconnect', () => console.log('❌ 연결 끊김'));
socket.on('reconnect', (attemptNumber) => console.log('🔄 재연결:', attemptNumber));
socket.on('reconnect_error', (error) => console.error('재연결 에러:', error));
```

---

## 추가 리소스

- [Socket.IO 클라이언트 문서](https://socket.io/docs/v4/client-api/)
- [Socket.IO 이벤트 참조](https://socket.io/docs/v4/client-api/#socket-on-eventName-callback)

---

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
