import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key가 서버에 설정되지 않았습니다.');
    const genAI = new GoogleGenerativeAI(apiKey);

    const { question, modelAnswer, rubric, userAnswer } = await request.json();
    
    // 미응시 즉시 0점 처리 방어 로직 (불필요한 API 호출 방지)
    if (!userAnswer || userAnswer.trim() === '') {
      return NextResponse.json({ 
        success: true, 
        result: { score: 0, feedback: "미응시하여 0점 처리되었습니다." } 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 대한민국 중고등학교의 공정하고 깐깐한 수석 교사입니다. 아래 제공된 문제와 채점 기준을 바탕으로 학생이 작성한 서술형 답안을 엄격하게 채점하세요.

[입력 데이터]
- 문제: ${question}
- 모범 답안: ${modelAnswer}
- 필수 채점 키워드 리스트: ${JSON.stringify(rubric)}
- 학생이 제출한 답안: ${userAnswer}

[채점 및 감점 감수 규칙]
1. 총점은 5점 만점(정수)입니다. 완전 미응시이거나 무관한 내용인 경우에만 0점을 부여하세요.
2. 학생의 답안이 모범 답안과 토씨 하나 틀리지 않고 일치할 필요는 없습니다. 문장의 표현이나 어순이 다르더라도, 핵심 의미가 통하고 동의어를 사용했다면 정답으로 인정해야 합니다.
3. 핵심 감점 요인은 [필수 채점 키워드(rubric)]의 포함 여부입니다. 키워드가 1개 누락될 때마다 1~2점씩 감점 코멘트와 함께 부분 점수를 부여하세요.
4. 부연 설명 없이 오직 아래 형식의 순수 JSON 객체만 반환하세요. 마크다운(\`\`\`json) 금지.

{
  "score": 4, 
  "feedback": "모범 답안의 맥락을 잘 이해하고 필수 키워드 'A'와 'B'를 훌륭하게 서술하였으나, 인과관계를 완성하는 핵심 키워드 'C'에 대한 언급이 누락되어 1점 감점합니다."
}`;

    // 3회 자동 재시도 방화벽
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON 형식을 찾을 수 없습니다.");

        const gradeData = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, result: gradeData });
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error('Essay Grading Error:', error);
    return NextResponse.json({ error: error.message || '채점 중 에러가 발생했습니다.' }, { status: 500 });
  }
}