# backend-express

### 애플리케이션 셋업
```shell
npm install
```

### 환경변수(.env) 설정
`.env.sample`을 `.env`로 복사하여 사용.  
pm2 실행중인 경우 pm2 재시작 해야함.
```dotenv
NODE_ENV='development 또는 production (default: production). 현재 사용되지 않음.'
PORT=포트 번호
MYSQL_HOST=DB 주소
MYSQL_PORT=DB 포트번호
MYSQL_DATABASE=DB이름
MYSQL_USER=DB유저
MYSQL_PASSWORD=DB유저 패스워드
LOGIN_ACCESS_TOKEN_SECRET=JWT 액세스 토큰 secret
LOGIN_REFRESH_TOKEN_SECRET=JWT 리프레시 토큰 secret
```

### 개발 및 테스트 실행
```shell
npm run dev
```

### pm2 설정
pm2 전역 설치
```shell
npm i -g pm2
```
`ecosystem.config.js.sample`을 `ecosystem.config.js`로 복사한 뒤 입맛에 맞게 수정.  
`script`항목은 `main.js`의 절대경로를 입력(ex: `/www/backend-express/main.js`)

pm2 실행
```shell
# 설정 파일로 실행
pm2 start ecosystem.config.js.sample

# 실행 상태 확인
pm2 list
```