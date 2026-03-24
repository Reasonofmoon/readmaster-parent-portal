# Funnel Integration

이 문서는 [readmaster-funnel](https://github.com/Reasonofmoon/readmaster-funnel) 의 `funnel.html`, `book.html` 같은 퍼널 프런트를 현재 READ MASTER 학부모 리포트 Apps Script 웹앱과 연결하는 기준 문서입니다.

## 통합 구조

하나의 Apps Script 웹앱 URL을 세 가지 용도로 씁니다.

1. `GET /exec?token=...`
학부모 리포트 공개 확인 페이지

2. `POST /exec`
설명회 예약, 상담 예약, 설명회 이후 리드 intake endpoint

3. `GET /exec?mode=intake-guide`
퍼널 개발자가 sample payload와 현재 연결 상태를 확인하는 공개 가이드 endpoint

## 권장 연결 방식

### 1. 가장 쉬운 방식: 공통 설정 파일 + JSON POST

```js
window.READMASTER_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec',
  branch: 'READ MASTER 대치점',
  funnelSource: '설명회 퍼널',
  bookingSource: '상담 예약 페이지'
};

// readmaster-funnel/assets/readmaster-config.js 에 저장
```

`readmaster-funnel`의 `funnel.html`, `book.html`은 이제 이 공통 설정 파일을 먼저 읽고 JSON POST를 시도합니다.
JSON 요청이 막히면 hidden form POST로 한 번 더 전송해 정적 퍼널에서도 intake 누락 가능성을 줄입니다.

### 2. CORS를 덜 타는 방식: 일반 form POST

정적 페이지에서 fetch가 부담되면 `form action`으로 바로 POST해도 됩니다. 현재 Apps Script는 form field도 intake합니다.

지원 필드:

- `parentName` 또는 `guardianName`
- `phone`
- `grade`
- `session`
- `branch` 또는 `campusName`
- `source`
- `studentName`
- `email`
- `memo`

## 시트 반영 위치

`Leads` 시트에 아래 흐름으로 쌓입니다.

- `Created At`
- `Guardian Name`
- `Phone`
- `Student Grade`
- `Preferred Session`
- `Campus Name`
- `Source`
- `Status`
- `Converted To Student`
- `Memo`

`Memo`에는 현재 학생명, 이메일, 추가 메모를 같이 적재합니다.

## readmaster-funnel 권장 연결

- `funnel.html`
  설명회 예약 lead intake
- `book.html`
  상담 예약 lead intake
- `curriculum.html`
  직접 POST는 없고, 리포트 및 카카오 버튼의 후속 이동 페이지로 사용

운영 시에는 각 페이지에 엔드포인트를 따로 하드코딩하지 말고 `assets/readmaster-config.js` 한 파일만 수정하는 방식으로 유지합니다.

권장 source 값:

- `설명회 퍼널`
- `상담 예약 페이지`
- `커리큘럼 랜딩`

## 운영 팁

- 설명회 예약과 상담 예약은 같은 endpoint를 써도 됩니다.
- 지점 구분은 `branch` 값으로 처리합니다.
- 각 가맹점별로 같은 Apps Script를 복제하거나, 같은 시트를 공유하면서 지점명으로 분기할 수 있습니다.
- 리포트 발송 후에는 `Reports` 시트와 `Leads` 시트를 수동 또는 후속 자동화로 연결해 전환 관리하면 됩니다.
- 배포 후 `GET ?mode=intake-guide` 응답의 `readmasterConfig` 값을 그대로 `assets/readmaster-config.js`에 옮기면 연결 실수가 줄어듭니다.
