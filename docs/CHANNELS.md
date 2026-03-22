# Delivery Channels

## 권장 우선순위

1. 학부모 확인 링크
2. 이메일
3. 카카오 알림톡 공급사 webhook

## 학부모 확인 링크

가장 빠른 방식입니다.

- Apps Script 웹앱 URL을 설정에 넣으면 학생별 `Portal URL` 생성
- 이 링크를 카카오톡 채널, 상담톡, 문자, 네이버 톡톡 등에 그대로 붙여 전달 가능
- 학부모는 로그인 없이 모바일에서 확인 가능

## 이메일

- 보호자 이메일이 있는 경우 바로 발송 가능
- PDF 첨부와 링크 동시 제공 가능
- 원장/강사가 가장 빠르게 검증하기 좋음

## 카카오 자동 발송

실제 운영은 아래 구조를 권장합니다.

- READ MASTER Apps Script
- 알림톡 공급사 webhook
- 카카오 알림톡 승인 템플릿

Apps Script는 공급사 webhook으로 아래 정보를 넘깁니다.

- 브랜드명
- 캠퍼스명
- 학생명
- 보호자명
- 보호자 전화번호
- 학부모 확인 링크
- PDF 링크
- 템플릿 코드
- 발신 프로필 Key
- 상담 예약 URL 버튼
- 퍼널/커리큘럼 URL 메타데이터
- fallbackText

권장 payload 구조 예시는 아래와 같습니다.

```json
{
  "vendor": "readmaster-parent-report",
  "senderKey": "@readmaster_channel",
  "templateCode": "RM_REPORT_01",
  "guardian": {
    "name": "김민서",
    "phone": "010-1234-5678",
    "email": "parent@example.com"
  },
  "student": {
    "name": "김하준",
    "className": "초등 영어 심화 A",
    "teacherName": "박선영",
    "overallScore": 91,
    "attendanceRate": 96
  },
  "report": {
    "portalUrl": "https://script.google.com/macros/s/.../exec?token=...",
    "pdfUrl": "https://drive.google.com/..."
  },
  "buttons": [
    {
      "type": "WL",
      "name": "리포트 확인",
      "url_mobile": "https://script.google.com/macros/s/.../exec?token=...",
      "url_pc": "https://script.google.com/macros/s/.../exec?token=..."
    },
    {
      "type": "WL",
      "name": "상담 예약",
      "url_mobile": "https://example.com/book.html",
      "url_pc": "https://example.com/book.html"
    }
  ]
}
```

즉, 이 프로젝트는 `카카오 직접 발송기`가 아니라 `알림톡 연동 가능한 운영 허브`로 보는 게 맞습니다.
