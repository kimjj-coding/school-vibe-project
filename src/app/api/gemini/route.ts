import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key가 서버에 없습니다.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const { topic, mode } = await request.json();
    if (!topic) throw new Error('주제가 없습니다.');

    // 👽 화석 탈출 기념: 스크린샷 1위 검증된 최신 스피드 엔진 장착 완료
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // 랭킹전은 20제, 자유 연습장은 5제
    const totalCount = mode === 'ranking' ? 20 : 5;

    // 💡 단 한 번의 쿼리로 난이도 비율까지 완벽하게 분할 출제하는 압축 프롬프트
    const prompt = `
주제: "${topic}"
중학교 내신 수준의 객관식 4지선다 딱 ${totalCount}문제를 출제하라.

[출제 비율]
${mode === 'ranking' ? 
  '- 하 (개념확인): 8개\n- 중 (자료해석): 8개\n- 상 (매력적 함정): 4개' : 
  '- 핵심 스피드 체크: 5개'}

[제약 조건]
1. 보기는 무조건 4개(options)여야 한다.
2. 설명, 인사말, 마크다운 기호(\`\`\`json 등) 절대 금지.
3. 오직 아래 규격의 순수 JSON 배열만 출력할 것.

[
  {
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 정답인덱스(0~3),
    "explanation": "해설"
  }
]`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("AI가 JSON 규격을 위반했습니다.");
    
    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, questions });

  } catch (error: any) {
    console.error('Gemini 2.5 Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
