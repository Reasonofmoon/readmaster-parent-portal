# Deployment

## 1. Apps Script 편집기 배포

1. Apps Script 편집기에서 `배포 > 새 배포`를 연다.
2. 배포 유형은 `웹 앱`을 선택한다.
3. 실행 계정은 `나`로 둔다.
4. 접근 권한은 `링크가 있는 모든 사용자` 또는 운영 정책에 맞는 공개 범위로 설정한다.
5. 배포 후 웹앱 URL을 복사한다.

## 2. 앱 설정 반영

스프레드시트의 `READ MASTER 리포트 > 대시보드 열기`에서:

- `학부모 확인 페이지 URL`에 웹앱 URL 입력
- `학부모 확인 링크 사용` 활성화
- `전달 방식` 선택
- 필요하면 `설명회 퍼널 URL`, `상담 예약 URL`, `커리큘럼 소개 URL` 입력
- 카카오 공급사 연동 시 `카카오 webhook URL`, `Token`, `템플릿 코드`, `발신 프로필 Key` 입력

같은 웹앱 URL은 두 용도로 같이 씁니다.

- `GET ?token=...` 학부모 리포트 확인
- `POST /exec` 설명회/상담 lead intake
- `GET ?mode=intake-guide` 퍼널 연동용 샘플 payload 확인

## 3. 첫 실행

1. `워크스페이스 초기화`
2. `가맹점 기본 설정 저장`
3. `Students` 시트에 학생 데이터 입력
4. 단건 생성 또는 일괄 생성
5. `Reports` 시트에서 링크/상태 확인

## 4. 배포 후 확인 항목

- 시트 메뉴가 보이는지
- Docs와 PDF가 생성되는지
- `Portal URL`이 생성되는지
- 학부모 링크가 모바일에서 열리는지
- 이메일 또는 webhook 전달 로그가 `Reports` 시트에 남는지

## 5. 운영 권장

- 가맹점별로 브랜드명과 캠퍼스명을 분리해 저장
- 본사 표준 템플릿 Google Docs를 만들어 `템플릿 Doc ID`로 공유
- 웹앱 URL은 각 가맹점에서 같은 방식으로 저장
- `readmaster-funnel`의 `funnel.html`, `book.html`, `curriculum.html` 배포 URL을 각 입력칸에 연결해 설명회 후속 상담 전환을 일원화
- 퍼널 쪽 프론트는 JSON POST 또는 일반 form POST 둘 다 가능하게 유지
