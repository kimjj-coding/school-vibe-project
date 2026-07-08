import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key가 서버에 설정되지 않았습니다.');
    const genAI = new GoogleGenerativeAI(apiKey);

    const { topic, mode } = await request.json();
    if (!topic) throw new Error('주제(topic)가 전달되지 않았습니다.');

    // 최상위 기용 가능 모델 강제 지정
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";
    
    // [미래 헌법 적용] mode에 따른 동적 프롬프트 분기 및 Few-Shot 예시 보강
    if (mode === 'exam') {
      prompt = `주제 및 범위: "${topic}"
당신은 대한민국 특목고 및 자사고 수준의 고난도 내신 기말고사를 출제하는 수석 출제 위원입니다. 위 다중 단원 범위를 통합하여 변별력이 매우 높은 [객관식 20문항 + 서술형 5문항] 총 25문항의 종합 시험지를 출제하세요.

[난이도 및 문항 배치 규칙]
1. 객관식 (1~20번): 
   - 1~10번(중급): 개념 통합 및 자료 해석형 문항
   - 11~17번(상급): 2개 이상의 단원이 복합적으로 융합된 인과관계 추론 문항
   - 18~20번(최상급): 학생들이 가장 많이 낚이는 매력적인 함정을 포함한 킬러 문항
2. 서술형 (21~25번): 
   - 단답형이나 단어 나열식은 절대 금지합니다. 원인, 과정, 이유, 의의를 2~3문장의 완결된 문장으로 서술해야 하는 논리형 문항으로만 구성하세요.
   - 각 서술형 문항에는 선생님 기준의 완벽한 [모범 답안(modelAnswer)]과 채점의 기준이 되는 [필수 포함 키워드 3개(rubric)]를 반드시 생성하세요.

[표준 가시성 및 표기 규칙]
1. 화학식/과학 원소: 반드시 유니코드 첨자를 사용하여 정확히 표기할 것 (예: H2O 금지 -> H₂O, CO₂ 등).
2. 코딩/프로그래밍 문제: 코드 블록 삽입 시 줄바꿈(\\n)과 4칸 들여쓰기 공백을 명확히 삽입하여 코딩 IDE처럼 읽기 쉽게 출제할 것.
3. [🚨중요] 보기/지문이 필요한 사료형 문제(예: "다음 <보기>에서 옳은 것을...", "다음 자료를 바탕으로...")는 절대로 ㄱ, ㄴ, ㄷ, ㄹ 등 세부 내용을 생략하지 말고, 반드시 아래 예시처럼 'context' 필드에 줄바꿈(\\n) 기호를 사용하여 상세히 원문을 기재하세요. 지문이 없는 단순 단답형 문제일 때만 'context' 필드를 비워두거나 생략해야 합니다.
4. 부연 설명이나 마크다운 기호(\`\`\`json 등) 절대 금지. 오직 아래 규격의 순수 JSON 객체만 출력할 것.

[문항 예시 규격]
{
  "objective": [
    {
      "context": "ㄱ. 과거제 최초 실시\\nㄴ. 노비안검법 통과\\nㄷ. 12목에 지방관 파견", 
      "question": "다음 (가) 인물이 추진한 정책으로 옳은 것을 <보기>에서 모두 고른 것은?",
      "options": ["ㄱ, ㄴ", "ㄱ, ㄷ", "ㄴ, ㄷ", "ㄴ, ㄹ"],
      "answer": 0,
      "explanation": "(가) 인물은 고려 광종입니다. 광종은 왕권 강화를 위해 노비안검법과 과거제를 실시하였습니다. ㄷ의 12목 지방관 파견은 성종의 업적이므로 정답은 1번입니다."
    }
  ],
  "essay": [
    {
      "question": "서술형 문제 내용 (문장형 서술 요구)",
      "modelAnswer": "출제 위원 기준의 표준 모범 답안",
      "rubric": ["필수키워드1", "필수키워드2", "필수키워드3"],
      "maxScore": 5
    }
  ]
}`;
    } else {
      const questionCount = mode === 'ranking' ? 20 : 5;
      prompt = `주제: "${topic}"\n당신은 중고등학생을 위한 수석 출제 위원입니다. 위 주제를 바탕으로 4지 선다형 객관식 문제 정확히 ${questionCount}개를 출제하세요.\n\n[출제 지침]\n`;
      if (mode === 'ranking') {
        prompt += `- 난이도 배분: 1~8번은 기본 개념 확인, 9~15번은 자료 해석 및 추론, 16~20번은 오답률 80% 이상의 킬러 문항 및 매력적인 함정으로 점진적 우상향하도록 구성할 것.\n`;
      } else {
        prompt += `- 단순 개념 확인, 시대적 배경/인과관계 추론, 학생들이 자주 헷갈리는 오답 함정 문항을 고르게 섞을 것.\n`;
      }
      prompt += `- 가시성 및 포맷팅: 화학식/원소 기호는 반드시 첨자를 사용해 정확히 표기할 것 (예: H2O 금지 -> H₂O). 코딩 문제는 줄바꿈(\\n)과 4칸 들여쓰기 유지.
- [🚨중요] 보기/지문이 필요한 사료형 문제(예: "다음 <보기>에서 옳은 것을...", "다음 자료를 바탕으로...")는 절대로 ㄱ, ㄴ, ㄷ, ㄹ 등 세부 내용을 생략하지 말고, 반드시 아래 예시처럼 'context' 필드에 줄바꿈(\\n) 기호를 사용하여 상세히 원문을 기재하세요. 지문이 없는 단순 단답형 문제일 때만 'context' 필드를 비워두거나 생략해야 합니다.
- 출력 형식은 마크다운 기호 없이 오직 JSON 배열로만 작성.

[출력 예시]
[
  {
    "context": "ㄱ. 과거제 최초 실시\\nㄴ. 노비안검법 통과\\nㄷ. 12목에 지방관 파견",
    "question": "다음 (가) 인물이 추진한 정책으로 옳은 것을 <보기>에서 모두 고른 것은?",
    "options": ["ㄱ, ㄴ", "ㄱ, ㄷ", "ㄴ, ㄷ", "ㄴ, ㄹ"],
    "answer": 0,
    "explanation": "(가) 인물은 고려 광종입니다. 광종은 왕권 강화를 위해 노비안검법과 과거제를 실시하였습니다. ㄷ의 12목 지방관 파견은 성종의 업적이므로 정답은 1번입니다."
  }
]`;
    }

    // 500 에러 대비 3회 자동 재시도 (Exponential Backoff) 방화벽
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      try {
        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        // mode에 따른 동적 정규식 파싱 방어 (객체 {} vs 배열 [])
        const regex = mode === 'exam' ? /\{[\s\S]*\}/ : /\[[\s\S]*\]/;
        const jsonMatch = textResponse.match(regex);
        
        if (!jsonMatch) {
          throw new Error(`JSON 추출 실패. 원본 텍스트: ${textResponse.substring(0, 50)}...`);
        }

        const pureJsonString = jsonMatch[0];
        const quizData = JSON.parse(pureJsonString);
        
        return NextResponse.json({ success: true, questions: quizData });
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempt === 1 ? 1000 : 2000));
        }
      }
    }

    throw lastError;

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}