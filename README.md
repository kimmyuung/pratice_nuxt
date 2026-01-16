# Nuxt 3 게시판 프로젝트

이 프로젝트는 **Nuxt 3**와 **MongoDB**로 구축된 **게시판 애플리케이션**입니다. 서버 사이드 렌더링(SSR), JWT 기반 인증, 그리고 OAuth2 소셜 로그인(카카오, 네이버) 기능을 갖춘 풀스택 애플리케이션입니다.

## 🛠 기술 스택

- **프레임워크**: [Nuxt 3](https://nuxt.com/) (Vue 3, Nitro)
- **데이터베이스**: [MongoDB](https://www.mongodb.com/) (Mongoose 사용)
- **인증**: JWT (JSON Web Token), OAuth2 (카카오, 네이버)
- **상태 관리**: Nuxt `useState` / `useCookie`
- **스타일링**: Scoped CSS

## 📊 ERD (개체 관계 다이어그램)

```mermaid
erDiagram
    User ||--o{ Board : writes
    User {
        String _id PK "MongoDB ObjectId"
        String userid uk "고유 사용자 ID"
        String name "사용자 이름 / 닉네임"
        String password "해시된 비밀번호 (OAuth 사용자의 경우 선택 사항)"
        String email "이메일 주소"
        String job "직업"
        String hobbies "취미"
        String gender "성별"
        String provider "인증 제공자 (local, kakao, naver)"
        String providerId "소셜 제공자 ID"
        Date createdAt
        Date updatedAt
    }
    Board {
        String _id PK "MongoDB ObjectId"
        String userid FK "작성자 사용자 ID"
        String writer "작성자 이름"
        String title "게시글 제목"
        String content "게시글 내용"
        Number hitno "조회수"
        Date regDate "작성일"
        Date updatedAt "수정일"
    }
```

## 🔄 OAuth2 로그인 시퀀스 다이어그램

다음 다이어그램은 소셜 로그인(카카오/네이버)의 인증 흐름을 설명합니다.

```mermaid
sequenceDiagram
    participant Client as 프론트엔드 (Nuxt)
    participant AuthAPI as 인증 핸들러 (/api/auth)
    participant Provider as 인증 제공자 (네이버/카카오)
    participant DB as MongoDB

    Client->>AuthAPI: GET /api/auth/{provider}
    AuthAPI-->>Client: 302 인증 제공자 URL로 리다이렉트
    
    Client->>Provider: 사용자 로그인 및 권한 승인
    Provider-->>Client: 302 콜백 URL로 리다이렉트?code=...
    
    Client->>AuthAPI: GET /api/auth/{provider}/callback?code=...
    
    AuthAPI->>Provider: POST /token (액세스 토큰 요청)
    Provider-->>AuthAPI: 액세스 토큰 발급
    
    AuthAPI->>Provider: GET /user/me (사용자 정보 요청)
    Provider-->>AuthAPI: 사용자 프로필 (id, email 등)
    
    AuthAPI->>DB: provider 및 providerId로 사용자 조회
    alt 사용자 존재함
        DB-->>AuthAPI: 사용자 정보 반환
    else 사용자 없음
        AuthAPI->>DB: 신규 사용자 생성
        DB-->>AuthAPI: 신규 사용자 반환
    end
    
    AuthAPI->>AuthAPI: JWT 토큰 생성
    AuthAPI-->>Client: 쿠키 설정 (auth_token) 및 /board/list로 리다이렉트
```

## 📝 테이블 (컬렉션) 명세서

### 1. 사용자 컬렉션 (`users`)

| 필드명 | 타입 | 필수 여부 | 고유 여부 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | 예 | 예 | MongoDB 문서 ID |
| `userid` | String | 예 | 예 | 사용자 고유 식별자 (예: `user1`, `kakao_12345`) |
| `name` | String | 예 | 아니오 | 사용자 표시 이름 또는 닉네임 |
| `password` | String | 아니오* | 아니오 | 해시된 비밀번호. `local` 제공자인 경우에만 필수. |
| `email` | String | 예 | 아니오 | 사용자 이메일 주소 |
| `job` | String | 아니오 | 아니오 | 사용자 직업 |
| `hobbies` | String | 아니오 | 아니오 | 사용자 취미 |
| `gender` | String | 아니오 | 아니오 | 사용자 성별 |
| `provider` | String | 예 | 아니오 | 로그인 제공자: `local`, `kakao`, `naver` (기본값: `local`) |
| `providerId` | String | 아니오 | 아니오 | 소셜 제공자의 고유 ID |
| `createdAt` | Date | 예 | 아니오 | 생성 일시 |
| `updatedAt` | Date | 예 | 아니오 | 마지막 수정 일시 |

### 2. 게시판 컬렉션 (`boards`)

| 필드명 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | 예 | MongoDB 문서 ID |
| `userid` | String | 예 | 작성자의 사용자 ID |
| `writer` | String | 예 | 작성자의 이름 |
| `title` | String | 예 | 게시글 제목 |
| `content` | String | 예 | 게시글 내용 |
| `hitno` | Number | 아니오 | 조회수 (기본값: 0) |
| `regDate` | Date | 예 | 작성 일시 (`createdAt` 별칭) |
| `updatedAt` | Date | 예 | 마지막 수정 일시 |

## 🚀 설치 및 실행 가이드

### 사전 요구사항
- Node.js (v18 이상)
- MongoDB (로컬 또는 Atlas)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (.env)

루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 설정하세요:

```ini
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/boarddev

# 인증 시크릿 키
JWT_SECRET=your_jwt_secret_key

# OAuth 제공자 설정
# 카카오
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 네이버
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 퍼블릭 URL (콜백용)
BASE_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3000`에서 시작됩니다.
