# READ MASTER Parent Report GAS

READ MASTER 프랜차이즈 가맹 학원과 학원장이 바로 쓸 수 있도록 만든 Google Apps Script + `clasp` 기반 학부모 리포트 운영 도구입니다.

이 프로젝트는 스프레드시트를 운영 콘솔로 사용하고, Google Docs/PDF 리포트 생성, 학부모 확인 링크 발급, 이메일 또는 카카오 알림톡 공급사 webhook 연동 준비까지 포함합니다.

현재 구조는 [readmaster-funnel](https://github.com/Reasonofmoon/readmaster-funnel) 과 같이 쓰는 것을 전제로 확장하고 있습니다. 즉 `설명회 퍼널 -> 상담 예약 -> 레벨테스트 -> 학부모 리포트 -> 등록 상담` 흐름을 한 Google Sheets/Apps Script 허브에서 관리하는 방향입니다.

## 핵심 가치

- 원장과 강사가 스프레드시트만으로 학생 리포트를 운영
- 가맹점별 `브랜드명`, `캠퍼스명`, `발신자명`을 저장
- 학생별 Google Docs/PDF 리포트 자동 생성
- 학부모가 모바일에서 바로 보는 공개 링크 생성
- 이메일 발송 또는 카카오 알림톡 공급사 webhook 준비
- 튜토리얼 모달과 원장용 대시보드 UX 제공
- 설명회/상담 funnel POST intake endpoint 제공
- Leads 시트로 설명회 유입 리드 누적
- 상담 예약/커리큘럼 URL을 리포트와 카카오 버튼에 연결
- LevelTests 시트 기반 레벨테스트 리포트 자동 생성
- PortalViews 시트 기반 학부모 링크 열람 로그

## 현재 구성

- [App.gs](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/App.gs)
  운영 메뉴, 시트 초기화, 대시보드 데이터, 학부모 공개 페이지 진입점
- [ReportService.gs](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/ReportService.gs)
  Docs/PDF 생성, 전달 채널 처리, 전달 로그 기록
- [Sidebar.html](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/Sidebar.html)
  원장용 운영 대시보드 UI
- [Tutorial.html](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/Tutorial.html)
  프랜차이즈 가이드 모달
- [ParentPortal.html](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/ParentPortal.html)
  학부모 공개 확인 페이지
- [appsscript.json](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/src/appsscript.json)
  웹앱/권한 설정

## 운영 흐름

1. 시트에서 `READ MASTER 리포트` 메뉴를 연다.
2. `워크스페이스 초기화`로 Students/Reports/Leads/LevelTests/PortalViews 시트를 만든다.
3. 브랜드명, 캠퍼스명, 웹앱 URL, 전달 방식을 저장한다.
4. 학생 데이터를 입력하고 단건 또는 일괄 생성한다.
5. Google Docs/PDF와 학부모 링크를 만든다.
6. 이메일 또는 카카오 알림톡 공급사 webhook으로 전달한다.
7. 설명회 퍼널이나 예약 페이지에서 같은 웹앱 URL로 POST해 Leads 시트에 리드를 쌓는다.
8. LevelTests 시트에서 테스트 결과를 입력하고 리포트를 일괄 생성한다.

## 전달 채널 전략

- `link_only`
  가장 빠른 운영 방식. 학부모 확인 링크를 생성해 카카오톡 채널, 상담톡, 문자에 붙여 전달
- `email`
  Gmail로 PDF와 안내문 발송
- `email_and_link`
  이메일 본문에 링크 포함
- `kakao_webhook`
  카카오 알림톡 공급사 또는 비즈메시지 운영사의 webhook으로 전달

일반 Kakao Open API만으로 임의 학부모에게 자동 메시지를 보내는 것은 제품 운영 관점에서 맞지 않으므로, 실제 상용 운영은 알림톡 공급사 연동으로 가는 편이 안전합니다.

## 빠른 시작

```bash
cd /Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS
npm install
npx clasp login --no-localhost
npx clasp push -f
```

현재 연결된 Script ID는 [.clasp.json](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/.clasp.json) 에 들어 있습니다.

## 배포

웹앱 배포와 학부모 링크 운영은 [DEPLOYMENT.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/DEPLOYMENT.md)를 보면 됩니다.

카카오/링크 전달 구조는 [CHANNELS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/CHANNELS.md)에 정리했습니다.

설명회 퍼널 연결 방식은 [FUNNEL-INTEGRATION.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/FUNNEL-INTEGRATION.md)에 정리했습니다.

학원 운영 확장 아이디어는 [ACADEMY-TOOLS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/ACADEMY-TOOLS.md), 제품 로드맵은 [IDEAS.md](/Users/soundfury37gmail.com/Downloads/MyZettelkasten/Project-ParentReportGAS/docs/IDEAS.md)에 정리했습니다.
