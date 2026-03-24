# readmaster-parent-portal

Google Apps Script + `clasp` 기반의 READ MASTER 운영 허브입니다. 이 저장소는 학부모 리포트 생성, 공개 학부모 포털, 설명회/상담 리드 intake, 원장용 리드 운영 보드를 한 스프레드시트 워크플로우로 묶습니다.

현재 상태:

- `ParentReportGAS` 웹앱은 익명 `GET`/브라우저 form `POST` intake 기준으로 운영 가능
- `readmaster-funnel` 운영 URL은 `https://readmaster-funnel.vercel.app`
- 스프레드시트 메뉴에서 리드 필터, 후속 연락 보기, 테스트 리드 정리까지 가능
- 카카오 webhook, 이메일 발송은 연동 포인트는 있지만 운영 공급사 설정은 별도 필요

## What This Repo Does

- 학생별 Google Docs/PDF 학부모 리포트 생성
- 학부모용 공개 링크 발급과 열람 로그 기록
- 설명회 퍼널/상담 예약 페이지에서 `Leads` 시트로 리드 적재
- `Leads`, `LevelTests`, `Reports`, `PortalViews` 시트 기반 운영 보드 제공
- 후속 연락 대상, 담당자별, 캠퍼스별 리드 필터 제공
- 설명회 퍼널, 상담 예약, 커리큘럼 링크를 리포트와 후속 상담 흐름에 연결

## Repository Map

- [src/App.gs](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/App.gs)
  웹앱 진입점, 시트 메뉴, 리드 운영 액션, 퍼널 연동 가이드 응답
- [src/ReportService.gs](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/ReportService.gs)
  Docs/PDF 리포트 생성과 전달 payload 처리
- [src/Sidebar.html](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/Sidebar.html)
  원장용 대시보드 UI
- [src/ParentPortal.html](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/ParentPortal.html)
  학부모 공개 포털
- [docs/DEPLOYMENT.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/DEPLOYMENT.md)
  Apps Script 웹앱 배포와 퍼널 URL 연결
- [docs/FUNNEL-INTEGRATION.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/FUNNEL-INTEGRATION.md)
  `readmaster-funnel` 연동 방식
- [docs/OPERATIONS-CHECKLIST.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/OPERATIONS-CHECKLIST.md)
  배포 직후 점검과 일상 운영 체크리스트
- [docs/CHANNELS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/CHANNELS.md)
  링크/이메일/카카오 전달 채널 구조

## Quick Start

### Prerequisites

- Node.js
- Google account with Apps Script access
- `clasp` login 권한
- 연결할 Google Spreadsheet 또는 기존 Script ID

### Install

```bash
cd /Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS
npm install
```

### Authenticate And Push

```bash
npm run clasp:login
npm run clasp:push
```

현재 로컬 Script 연결 정보는 [.clasp.json.example](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/.clasp.json.example) 형식을 따릅니다. 실제 `.clasp.json`은 Git에 포함하지 않습니다.

### Open Apps Script Editor

```bash
npm run clasp:open
```

### Optional Logs

```bash
npm run clasp:tail
```

## Runtime And Deployment

1. Apps Script 웹앱을 `execute as: USER_DEPLOYING`, anonymous access 가능한 형태로 배포합니다.
2. `GET ?mode=intake-guide`가 JSON으로 열리는지 확인합니다.
3. `readmaster-funnel`은 `https://readmaster-funnel.vercel.app/funnel`, `https://readmaster-funnel.vercel.app/book`, `https://readmaster-funnel.vercel.app/curriculum` 를 기준으로 연결합니다.
4. 운영 검증은 실제 퍼널 폼 제출 1건과 `Leads` 시트 적재 확인까지 합니다.

상세 단계는 [docs/DEPLOYMENT.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/DEPLOYMENT.md) 를 보세요.

## Day-To-Day Workflow

스프레드시트 메뉴 `READ MASTER 리포트` 에서 바로 운영합니다.

- `워크스페이스 초기화`
- `리드 상태 색상 적용`
- `최근 7일 신규 리드 보기`
- `오늘 후속 연락 리드 보기`
- `담당자별 리드 보기`
- `캠퍼스별 리드 보기`
- `테스트 리드 숨기기`
- `리드 숨김 해제`
- `테스트 리드 정리`

운영 루틴은 [docs/OPERATIONS-CHECKLIST.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/OPERATIONS-CHECKLIST.md) 를 기준으로 유지하면 됩니다.

## Integration Notes

- 정적 퍼널에서 Apps Script intake는 `fetch`보다 브라우저 form POST fallback이 더 안정적입니다.
- 퍼널 엔드포인트는 페이지별 하드코딩 대신 공통 설정에서 관리합니다.
- `ParentReportGAS`와 `readmaster-funnel`은 별도 저장소지만 하나의 운영 퍼널로 취급합니다.

## Developer Workflow

- Apps Script 코드는 [src/](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src) 아래에서 수정합니다.
- 문서 변경은 코드 변경과 같이 커밋하는 편이 맞습니다.
- 운영 동작을 바꾼 경우 최소한 `npx clasp push -f` 또는 `npm run clasp:push` 까지는 확인합니다.
- 퍼널 URL이나 intake 구조를 바꾼 경우 [docs/FUNNEL-INTEGRATION.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/FUNNEL-INTEGRATION.md) 와 [docs/DEPLOYMENT.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/DEPLOYMENT.md) 를 함께 갱신합니다.

## Documentation Index

- [docs/DEPLOYMENT.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/DEPLOYMENT.md)
- [docs/FUNNEL-INTEGRATION.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/FUNNEL-INTEGRATION.md)
- [docs/OPERATIONS-CHECKLIST.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/OPERATIONS-CHECKLIST.md)
- [docs/CHANNELS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/CHANNELS.md)
- [docs/ACADEMY-TOOLS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/ACADEMY-TOOLS.md)
- [docs/IDEAS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/IDEAS.md)

## Security

보안 이슈 제보는 [SECURITY.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/SECURITY.md) 를 따릅니다.

## License

현재 이 저장소에는 별도 라이선스 파일이 없습니다. 외부 공개 배포 기준을 정하기 전까지는 사용 조건을 명시적으로 확정하지 않은 상태로 봐야 합니다.
