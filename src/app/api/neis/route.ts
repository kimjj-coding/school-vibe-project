import { NextResponse } from 'next/server';

// 500 에러 및 네트워크 순시 장애 방어 목적 3회 자동 재시도 헬퍼 함수
async function fetchWithRetry(url: string, attempts = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐싱 적용
    if (!response.ok && attempts > 1) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, attempts - 1, delay * 2);
  }
}

export async function GET(request: Request) {
  try {
    // 1. 보안 환경변수 검증
    const apiKey = process.env.NEIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NEIS API 키가 서버 시스템에 설정되지 않았습니다.' }, { status: 500 });
    }

    // 2. 쿼리 스트링 파라미터 획득
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'meal'; // meal 또는 timetable
    
    // 타임존 연산 안전 처리
    const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = kstFormatter.formatToParts(new Date());
    const ye = parts.find(p => p.type === 'year')?.value || '2026';
    const mo = parts.find(p => p.type === 'month')?.value || '07';
    const da = parts.find(p => p.type === 'day')?.value || '08';
    const defaultDate = `${ye}${mo}${da}`;
    const date = searchParams.get('date') || defaultDate;

    // 💡 [미래 지향적 버그 원천 차단] 나이스 표준 학교 정보를 실시간으로 먼저 검색하여 고유 코드 추출
    const schoolSearchUrl = `https://open.neis.go.kr/hub/schoolInfo?KEY=${apiKey}&Type=json&SCHUL_NM=풍양중학교`;
    const searchRes = await fetchWithRetry(schoolSearchUrl);
    const searchData = await searchRes.json();
    
    let officeCode = 'J10'; // 기본 경기도 fallback
    let schoolCode = '7530851'; // 기본 fallback
    
    if (searchData.schoolInfo) {
      const schoolRows = searchData.schoolInfo[1].row;
      // 여러 풍양중 중 관할조직이 중학교인 진짜 남양주 풍양중학교 필터링
      const realPungyang = schoolRows.find((r: any) => r.SCHUL_KND_SC_NM === '중학교') || schoolRows[0];
      if (realPungyang) {
        officeCode = realPungyang.ATPT_OFCDC_SC_CODE;
        schoolCode = realPungyang.SD_SCHUL_CODE;
      }
    }

    // 4. 요청 분기 및 공식 OpenAPI 엔드포인트 연동
    if (type === 'meal') {
      const mealUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=5&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date}`;
      const res = await fetchWithRetry(mealUrl);
      const data = await res.json();

      // 급식 데이터 가공 정제
      if (data.mealServiceDietInfo) {
        const rows = data.mealServiceDietInfo[1].row;
        // 조식/석식을 제외한 순수 중식(점심) 데이터 타겟팅
        const mealData = rows.find((r: any) => r.MMEAL_SC_NM.includes('중식')) || rows[0];
        const rawDishes = mealData.DDISH_NM;
        
        // 특수 태그 및 알레르기 유발 유전 정보 제거 후 순수 반찬 리스트 정제
        const cleanedDishes = rawDishes
          .split('<br/>')
          .map((dish: string) => dish.replace(/[0-9*.()#]/g, '').trim()) // # 기호까지 완벽 제거
          .filter(Boolean);

        return NextResponse.json({
          success: true,
          mealType: mealData.MMEAL_SC_NM,
          dishes: cleanedDishes,
          calories: mealData.CAL_INFO,
        });
      } else {
        return NextResponse.json({ success: true, mealType: '', dishes: [], calories: '' });
      }

    } else if (type === 'timetable') {
      // 💡 [시간표 미출력 버그 수정] 학년(GRADE)과 반(CLASS_NM) 인자를 2학년 1반 기준으로 기본 주입하여 바인딩 성공
      const grade = searchParams.get('grade') || '2';
      const classNm = searchParams.get('class') || '1';

      const timetableUrl = `https://open.neis.go.kr/hub/misTimetable?KEY=${apiKey}&Type=json&pIndex=1&pSize=20&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&ALL_TI_YMD=${date}&GRADE=${grade}&CLASS_NM=${classNm}`;
      const res = await fetchWithRetry(timetableUrl);
      const data = await res.json();

      // 시간표 순서 정렬 가공
      if (data.misTimetable) {
        const rawRows = data.misTimetable[1].row;
        const formattedTimetable = rawRows
          .map((row: any) => ({
            period: parseInt(row.PERIO, 10), // 교시 번호
            subject: row.ITRT_CONTENT ? row.ITRT_CONTENT.trim() : row.ITRT_CNTNT.trim(), // 나이스 시스템 필드 범용 대응
          }))
          .sort((a: any, b: any) => a.period - b.period);

        return NextResponse.json({
          success: true,
          timetable: formattedTimetable,
        });
      } else {
        return NextResponse.json({ success: true, timetable: [] });
      }
    }

    return NextResponse.json({ error: '알 수 없는 요청 타입입니다.' }, { status: 400 });

  } catch (error: any) {
    console.error('NEIS 통합 프록시 API 에러:', error);
    return NextResponse.json({ error: `나이스 서버 동적 응답 획득 실패: ${error.message}` }, { status: 500 });
  }
}