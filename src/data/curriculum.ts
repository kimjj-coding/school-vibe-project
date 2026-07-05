// 파일 경로: src/data/curriculum.ts

export interface Chapter {
  id: string;        // 랭킹전 DB 저장용 고유 Key
  title: string;     // 화면 드롭다운에 보여질 깔끔한 단원명
  promptDoc: string; // AI 출제위원의 멱살을 잡고 정확한 범위를 지시할 비밀 문서
}

// 💡 향후 초등/고등 데이터가 추가되어도 끄떡없는 확장형 구조
export const CURRICULUM_DB: Record<string, Record<string, Chapter[]>> = {
  "중등": {
    "역사": [
      { 
        id: "MID_HIS2_01", 
        title: "Ⅰ. 문명의 발생과 고대 세계의 형성", 
        promptDoc: "중학교 역사 고대 4대 문명(메소포타미아, 이집트, 인더스, 황하)의 특징과 발생지 출제" 
      },
      { 
        id: "MID_HIS2_02", 
        title: "Ⅱ. 세계 종교의 확산과 지역 문화의 형성", 
        promptDoc: "중학교 역사 불교, 크리스트교, 이슬람교의 성립 과정과 각 종교의 문화적 특징 출제" 
      },
      { 
        id: "MID_HIS2_03", 
        title: "Ⅲ. 지역 세계의 교류와 변화", 
        promptDoc: "중학교 역사 몽골 제국의 발전, 신항로 개척, 르네상스와 종교 개혁 출제" 
      }
    ],
    "과학": [
      { 
        id: "MID_SCI2_01", 
        title: "Ⅰ. 물질의 구성", 
        promptDoc: "중학교 2학년 과학 원소, 원자, 분자의 개념 차이와 이온식 및 불꽃 반응 색깔 출제" 
      },
      { 
        id: "MID_SCI2_02", 
        title: "Ⅱ. 전기와 자기", 
        promptDoc: "중학교 2학년 과학 마찰전기, 옴의 법칙(전압, 전류, 저항 계산), 자기장과 전자기력 출제" 
      },
      { 
        id: "MID_SCI2_03", 
        title: "Ⅲ. 태양계", 
        promptDoc: "중학교 2학년 과학 지구의 자전과 공전, 달의 위상 변화, 태양계 행성들의 특징 출제" 
      }
    ]
  }
};
