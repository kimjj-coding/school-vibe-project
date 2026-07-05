'use client';

export default function SettingsPage() {
  return (
    <div className="px-5 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">⚙️ 마이 커스텀 설정</h1>
        <p className="text-xs text-gray-400 mt-0.5">내 입맛대로 앱의 구석구석을 인테리어 하세요.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
          <span>🎨 테마 스타일</span>
          <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">라이트 모드 (기본)</span>
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
          <span>🔔 딴짓 감지 경고음</span>
          <span className="text-gray-400">준비 중</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-normal text-center pt-4">
          "총괄 기획자님이 원하는 수많은 커스텀 요소들이<br/>앞으로 이곳에 빽빽하게 입주할 예정입니다! 🚀"
        </p>
      </div>
    </div>
  );
}
