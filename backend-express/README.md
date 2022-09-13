# backend-express

## 애플리케이션 셋업
```shell
$ npm install
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
$ npm run dev
```

### pm2 설정
pm2 전역 설치
```shell
$ npm i -g pm2
```
`ecosystem.config.js.sample`을 `ecosystem.config.js`로 복사한 뒤 입맛에 맞게 수정.  
`script`항목은 `main.js`의 절대경로를 입력(ex: `/www/backend-express/main.js`)

pm2 실행
```shell
# 설정 파일로 실행
$ pm2 start ecosystem.config.js.sample

# 실행 상태 확인
$ pm2 list
```
## CLI 기능
### DB 생성
CLI를 통해 DB 테이블 생성.  
CLI 실행전 **환경변수에 DB접속정보**가 설정되어 있어야함.  
CLI가 아닌 직접 생성하고 싶은 경우. `./database/ddl/`안의 SQL파일을 사용하면 됨.  
```shell
# 사용자 정보 테이블 생성
$ node cli/db.js create user

# 재테크 가계부 테이블 생성
$ node cli/db.js create investHistory
```

### 사용자 추가
사용자 추가는 현재는 CLI를 통해서만 가능.
```shell
# 사용자 생성에 필요한 정보 입력
$ node cli/user.js add
? 사용자ID:
? 비밀번호: [input is hidden]
? 이름:
```

### 비밀번호 변경
비밀번호는 웹으로도 가능.
```shell
$ node cli/user.js change-password
? 사용자ID:
? 변경할 비밀번호: [input is hidden]
```

### 로그인 실패 횟수 초기화
보안을 위해 로그인을 일정 횟수이상 실패한 경우 로그인이 제한되는데 그 횟수를 초기화할 때 사용.
```shell
$ node cli/user.js reset-login-fail
? 사용자ID:
? 로그인 실패횟수를 초기화 하시겠습니까? (Y/n)
```