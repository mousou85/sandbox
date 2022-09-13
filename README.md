# SAND BOX
프로그래밍 언어 학습 및 개인적인 필요에 의해 개발중인 애플리케이션.

## 디렉토리 구분
루트기준으로 아래와 같이 구분됨
- `backend-xxx`: 백엔드 API로 `xxx`는 언어 또는 프레임워크 이름
- `frontend-xxx`: 프론트엔드 소스로 `xxx`는 언어 또는 프레임워크 이름

## 애플리케이션 구분
- `backend-express`: nodejs express로 구현한 백엔드 API
- `frontend-vue`: vuejs3로 구현한 프론트엔드
### 애플리케이션 기능
- 사용자 관련
  - 사용자 관리
  - 로그인
- 재테크 가계부
  - 기업 관리
  - 상품 관리
  - 화폐 관리
  - 재테크 이력 관리
  - 재테크 요약(투자원금, 실현손익, 손익률 등)

## 기능 개발 진행상황
- backend-express
  - 공통
    - :white_check_mark: DB 관련 모듈 추가
      - :white_check_mark: mysql2, knex 패키지 적용
      - 다른 모듈로 전환 검토
    - :white_check_mark: PM2 설정 추가
    - :white_check_mark: JWT 인증 적용
    - :white_check_mark: DB 테이블 생성 CLI 추가
  - 유저/로그인
    - 로그인
      - :white_check_mark: 로그인 API
      - :white_check_mark: OTP 인증 확인 API
    - 유저 생성
      - :white_check_mark: 유저 생성 기능(CLI)
      - 유저 생성 기능(API)
    - 유저 정보
      - :white_check_mark: 유저 정보 조회 API
      - :white_check_mark: 유저 정보 수정 API
    - 보안
      - 관리자/일반 사용자 권한 구분 추가 
      - :white_check_mark: OTP 등록/해제 API
      - :white_check_mark: 유저 비밀번호 변경(CLI)
      - :white_check_mark: 유저 비밀번호 변경(API)
      - :white_check_mark: 유저 로그인 차단 초기화(CLI)
  - 재테크 가계부
    - :white_check_mark: 유저별 가계부 관리 기능 사용되도록 변경
    - :white_check_mark: 기업 관리 API
      - :white_check_mark: 기업 관리 API 제거(상픔 그룹 관리 API로 대체)
    - :white_check_mark: 상품 관리 API
    - :white_check_mark: 화폐 관리 API
    - :white_check_mark: 재테크 이력 관리 API
    - :white_check_mark: 요약 정보 API
      - :white_check_mark: 전체/년간/월간 요약 API
      - 차트 데이터용 API
    - :white_check_mark: 상품 그룹 관리 API
- frontend-vue
  - 공통
    - :white_check_mark: vuex 적용
    - :white_check_mark: JWT 인증 적용
    - :white_check_mark: primevue 적용
    - :white_check_mark: 데스크톱/모바일 레이아웃 반응형으로 구성
  - 로그인
    - :white_check_mark: 로그인 관련 컴포넌트 추가
    - :white_check_mark: OTP 관련 컴포넌트 추가
  - 재테크 가계부
    - :white_check_mark: 기업 관리 컴포넌트 추가
      - :white_check_mark: 기업 관리 컴포넌트 제거(상품 그룹 관리 컴포넌트로 대체)
    - :white_check_mark: 상품 관리 컴포넌트 추가
    - :white_check_mark: 화폐 관리 컴포넌트 추가
    - :white_check_mark: 재테크 이력 컴포넌트 추가
    - :white_check_mark: 재테크 요약 정보 컴포넌트 추가
    - 차트 컴포넌트
    - :white_check_mark: 상품 그룹 관리 컴포넌트 추가