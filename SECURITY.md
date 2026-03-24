# Security Policy

보안 이슈는 GitHub issue로 공개 등록하지 않는 편이 안전합니다.

## Report A Vulnerability

- 재현 경로
- 영향 범위
- 관련 URL 또는 Script 배포 정보
- 가능하면 스크린샷 또는 로그

를 정리해서 저장소 소유자에게 비공개 채널로 전달해 주세요.

## Scope

이 저장소의 주요 보안 범위는 아래입니다.

- Apps Script 웹앱 공개 endpoint
- 학부모 포털 링크와 토큰 처리
- Google Sheets 기반 운영 데이터
- 이메일 또는 webhook 연동 설정값

## Secrets

- `.clasp.json`
- webhook token
- 공급사 API 키
- 운영용 Google 계정 정보

는 저장소에 커밋하면 안 됩니다.
