import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. 보안 환경변수에서 NEIS API 키 가져오기
    const apiKey = process.env.NEIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NEIS API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 2. 검색할 날짜 계산 (오늘 날짜를 YYYYMMDD 포맷으로 변환)
    const today = new Date();
    // Vercel 서버 시간대 차이를 고려하여 한국 시간(KST)으로 맞춤
    const kstDate = new Date(today.getTime() + (9 * 60 * 60 * 1000)); 
    const year = kstDate.getFullYear();
    const month = String(kstDate.getMonth() + 1).padStart(2, '0');
    const day = String(kstDate.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 3. 🎯 기획자님! 나중에 아래 코드를 서비스할 타겟 학교 코드로 변경해 주세요.
    // 현재는 테스트용으로 [서울특별시교육청(B10) / 선린인터넷고등학교(7010536)]가 세팅되어 있습니다.
    // ※ 내 학교 코드 찾는 곳: [https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN1702019041811134553592](https://open.neis.go.kr/portal/data/service/selectServicePage.do?infId=OPEN1702019041811134553592)
    const ATPT_OFCDC_SC_CODE = 'B10';
    const SD_SCHUL_CODE = '7010536'; 

    // 4. NEIS API 호출 URL 구성
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=1&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${dateStr}`;

    const res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 캐싱
    const data = await res.json();

    // 5. 응답 데이터 전처리
    if (data.mealServiceDietInfo) {
      const mealData = data.mealServiceDietInfo[1].row[0];
      // 원본 데이터: "혼합곡밥<br/>쇠고기미역국(5.6.16.)"
      // 가공 후: ["혼합곡밥", "쇠고기미역국"] (알레르기 숫자 및 괄호, 특수기호 제거)
      let dishes = mealData.DDISH_NM.split('<br/>').map((dish: string) => {
        return dish.replace(/[0-9*.()]/g, '').trim(); 
      }).filter(Boolean);

      return NextResponse.json({
        success: true,
        mealType: mealData.MMEAL_SC_NM, // 조식, 중식, 석식
        dishes: dishes
      });
    } else {
      // 급식 정보가 없는 경우 (RESULT 코드가 뜨는 경우)
      return NextResponse.json({ success: true, mealType: '', dishes: [] });
    }

  } catch (error) {
    console.error('NEIS API fetch error:', error);
    return NextResponse.json({ error: '급식 정보를 불러오는 중 서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
