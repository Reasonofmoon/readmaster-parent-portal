# Operations Checklist

## 배포 직후 5분 체크

1. `GET ?mode=intake-guide`가 JSON으로 열리는지 확인
2. `readmaster-funnel/assets/readmaster-config.js`의 endpoint가 현재 웹앱 URL과 일치하는지 확인
3. `https://readmaster-funnel.vercel.app/funnel` 또는 `https://readmaster-funnel.vercel.app/book` 에서 테스트 제출 1건을 넣고 `Leads` 시트에 적재되는지 확인
4. `Source`가 `설명회 퍼널` 또는 `상담 예약 페이지`로 정확히 들어오는지 확인
5. 원장 대시보드의 최신 리드와 보드가 갱신되는지 확인

## 운영 루틴

### 매일

1. `READ MASTER 리포트 > 최근 7일 신규 리드 보기`로 우선 확인
2. `READ MASTER 리포트 > 오늘 후속 연락 리드 보기`로 즉시 콜 대상 확인
3. 사이드바 보드에서 `CONTACTED`, `TEST_BOOKED`, `ENROLLED` 상태 반영
4. 예약 링크와 다음 액션 메모가 비어 있는 리드 정리
5. 필요하면 `담당자별 리드 보기`, `캠퍼스별 리드 보기`로 분배 점검

### 매주

1. `설명회 퍼널`과 `상담 예약 페이지` source별 유입 수 비교
2. `Converted To Student`가 `Y`로 바뀐 전환 리드 확인
3. 미응답 리드에 후속 안내 문구 발송

## 테스트 데이터 정리

운영 화면에서 테스트 데이터를 바로 치우고 싶으면 아래 순서로 씁니다.

1. `READ MASTER 리포트 > 테스트 리드 숨기기`
2. 실제 운영 리드만 확인
3. 필요하면 `READ MASTER 리포트 > 리드 숨김 해제`
4. 완전히 지울 때만 `READ MASTER 리포트 > 테스트 리드 정리`

스프레드시트 메뉴 `READ MASTER 리포트 > 테스트 리드 정리`를 실행하면 아래 패턴과 일치하는 리드를 삭제합니다.

- source 또는 memo에 `Codex`
- source 또는 memo에 `smoke test`
- source 또는 memo에 `browserform`
- source 또는 memo에 `final verification`
- 이름, 메모 등에 `테스트`
- 전화번호 `010-0000-0000`
- 전화번호 `010-9999-0000`

공개 웹앱에는 삭제 endpoint를 두지 않았고, 정리는 스프레드시트 내부 메뉴에서만 실행됩니다.

## 주의사항

- Apps Script 웹앱 intake는 정적 퍼널에서 `fetch`보다 브라우저 `form POST`가 더 안정적입니다.
- 퍼널 설정은 페이지별 수정 대신 `readmaster-funnel/assets/readmaster-config.js` 한 파일에서만 바꿉니다.
- 운영 확인은 `GET ?mode=intake-guide`와 실제 폼 제출 1건으로 끝내는 것이 가장 빠릅니다.
- `READ MASTER 리포트 > 리드 상태 색상 적용`을 한 번 실행하면 `NEW`, `CONTACTED`, `TEST_BOOKED`, `REPORT_READY`, `ENROLLED`, `PROMOTED` 색상 규칙이 유지됩니다.
- `READ MASTER 리포트 > 오늘 후속 연락 리드 보기`는 대시보드의 후속 연락 큐와 같은 기준으로 행을 남깁니다.
- `담당자별 리드 보기`, `캠퍼스별 리드 보기`는 입력한 값과 정확히 일치하는 행만 남깁니다.
