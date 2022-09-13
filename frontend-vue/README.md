# frontend-vue

### 애플리케이션 셋업
```shell
$ npm install
```

### 환경변수(.env) 설정
`.env.sample`을 `.env`로 복사하여 사용.
프로덕션 빌드는 `.env`가 변경된 경우 다시 실행해야함.
```dotenv
VITE_SITE_NAME='사이트 이름'
VITE_API_BASE_URL='백엔드 API 주소(default: http://localhost:5000)'
```

### 개발 및 테스트 실행
```shell
$ npm run dev
```

### 프로덕션 빌드
```shell
$ npm run build
```