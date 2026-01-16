import { Upload, Download, Sparkles, Zap, Image as ImageIcon, Scissors, Maximize2, RotateCw } from 'lucide-react';
import type { BatchOptions } from '../types';

interface SettingsPanelProps {
  options: BatchOptions;
  onOptionsChange: (options: BatchOptions) => void;
}

export default function SettingsPanel({ options, onOptionsChange }: SettingsPanelProps) {
  const updateOptions = <K extends keyof BatchOptions>(
    key: K,
    value: Partial<BatchOptions[K]>
  ) => {
    onOptionsChange({
      ...options,
      [key]: { ...options[key], ...value },
    });
  };

  // 통합 프리셋
  const applyPreset = (type: 'compress' | 'resize' | 'convert' | 'crop' | 'rotate' | 'upscale') => {
    switch (type) {
      case 'compress':
        updateOptions('resize', { mode: 'longest-side', longestSide: 1920 });
        updateOptions('output', { quality: 75, targetSizeKB: 500 });
        break;
      case 'resize':
        updateOptions('resize', { mode: 'longest-side', longestSide: 1920 });
        updateOptions('output', { quality: 90 });
        break;
      case 'convert':
        updateOptions('output', { format: 'jpeg', quality: 85 });
        break;
      case 'crop':
        updateOptions('crop', { enabled: true, aspect: '1:1' });
        break;
      case 'rotate':
        updateOptions('rotate', { degrees: 90 });
        break;
      case 'upscale':
        updateOptions('resize', { mode: 'upscale' as any, keepAspect: true });
        updateOptions('output', { quality: 95, format: 'png' });
        break;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="font-semibold text-white">빠른 작업</h2>
        <p className="text-xs text-gray-400 mt-1">원클릭으로 이미지 편집</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 메인 기능 카드 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 압축 */}
          <button
            onClick={() => applyPreset('compress')}
            className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-white group-hover:animate-pulse" />
              <span className="font-bold text-white">이미지 압축</span>
            </div>
            <p className="text-xs text-green-100 opacity-90">파일 크기를 500KB 이하로</p>
          </button>

          {/* 크기 조정 */}
          <button
            onClick={() => applyPreset('resize')}
            className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Maximize2 size={20} className="text-white group-hover:animate-pulse" />
              <span className="font-bold text-white">크기 조정</span>
            </div>
            <p className="text-xs text-blue-100 opacity-90">1920px 웹 최적화</p>
          </button>

          {/* 포맷 변환 */}
          <button
            onClick={() => applyPreset('convert')}
            className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg group"
          >
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={20} className="text-white group-hover:animate-pulse" />
              <span className="font-bold text-white">포맷 변환</span>
            </div>
            <p className="text-xs text-purple-100 opacity-90">JPG, PNG, WebP</p>
          </button>

          {/* 잘라내기 */}
          <button
            onClick={() => applyPreset('crop')}
            className="p-4 bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Scissors size={20} className="text-white group-hover:animate-pulse" />
              <span className="font-bold text-white">잘라내기</span>
            </div>
            <p className="text-xs text-orange-100 opacity-90">정사각형, 16:9 등</p>
          </button>

          {/* 회전 */}
          <button
            onClick={() => applyPreset('rotate')}
            className="p-4 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg group"
          >
            <div className="flex items-center gap-2 mb-2">
              <RotateCw size={20} className="text-white group-hover:animate-pulse" />
              <span className="font-bold text-white">회전</span>
            </div>
            <p className="text-xs text-indigo-100 opacity-90">90° 단위 회전</p>
          </button>

          {/* 업스케일 - 프리미엄 느낌 */}
          <button
            onClick={() => applyPreset('upscale')}
            className="p-4 bg-gradient-to-br from-yellow-500 via-pink-500 to-purple-600 hover:from-yellow-600 hover:via-pink-600 hover:to-purple-700 rounded-xl text-left transition-all transform hover:scale-105 shadow-2xl group relative overflow-hidden col-span-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%]"></div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Sparkles size={20} className="text-white animate-pulse" />
              <span className="font-bold text-white text-lg">AI 업스케일 & 화질 개선</span>
            </div>
            <p className="text-xs text-yellow-100 opacity-90 relative z-10 font-semibold">
              ✨ 흐릿한 사진 → 선명하게 복원
            </p>
            <p className="text-xs text-purple-100 opacity-80 relative z-10 mt-1">
              해상도 {options.resize.upscaleMultiplier || 2}배 향상 • 픽셀 깨짐 없이 고화질로
            </p>
          </button>
        </div>

        {/* AI 화질 개선 설명 박스 */}
        <div className="mt-4 p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
            <Sparkles size={16} className="animate-pulse" />
            AI 이미지 화질 개선 기술
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span><strong>흐릿한 사진 복원:</strong> 야경, 어두운 조명 속 인물 사진도 선명하게</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span><strong>픽셀 깨짐 방지:</strong> AI가 디테일을 예측해 자연스럽게 업스케일</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span><strong>전문가 수준 결과:</strong> 사진관 보정처럼 자연스럽고 디테일한 복원</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-cyan-500/20">
            <p className="text-xs text-cyan-200 font-semibold">💡 활용 사례</p>
            <p className="text-xs text-gray-400 mt-1">
              • 쇼핑몰 상품 이미지 • 증명사진 • SNS 업로드용 • 오래된 가족사진 복원
            </p>
          </div>
        </div>

        {/* 업스케일 배율 선택 (업스케일 모드일 때만 표시) */}
        {options.resize.mode === 'upscale' && (
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30 shadow-xl">
            <label className="block text-sm mb-3 text-white font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              업스케일 배율 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([2, 3, 4] as const).map((multiplier) => (
                <button
                  key={multiplier}
                  onClick={() => updateOptions('resize', { upscaleMultiplier: multiplier })}
                  className={`px-4 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                    (options.resize.upscaleMultiplier || 2) === multiplier
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-2xl scale-105'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl">{multiplier}x</div>
                  <div className="text-xs mt-1 opacity-80">
                    {multiplier === 2 && '빠름'}
                    {multiplier === 3 && '균형'}
                    {multiplier === 4 && '최대'}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <p className="text-xs text-yellow-200 font-semibold mb-1">🔍 화질 비교 팁</p>
              <p className="text-xs text-purple-200">
                변환 후 "비교" 버튼을 눌러 줌 슬라이더로 화질 개선을 확인하세요!
              </p>
            </div>
          </div>
        )}

        {/* 상세 설정 */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Download size={16} className="text-blue-400" />
            상세 설정
          </h3>

          <div className="space-y-4">
            {/* 크기 */}
            <div>
              <label className="block text-sm mb-2 text-gray-400">최대 크기 (px)</label>
              <div className="flex gap-2">
                {[1080, 1920, 2560, 3840].map((size) => (
                  <button
                    key={size}
                    onClick={() => updateOptions('resize', { longestSide: size })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      options.resize.longestSide === size
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            {/* 품질 */}
            <div>
              <label className="block text-sm mb-2 text-gray-400">
                품질: <span className="text-white font-bold">{options.output.quality}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={options.output.quality}
                onChange={(e) => updateOptions('output', { quality: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>최소</span>
                <span>최대</span>
              </div>
            </div>

            {/* 포맷 */}
            <div>
              <label className="block text-sm mb-2 text-gray-400">출력 포맷</label>
              <div className="grid grid-cols-3 gap-2">
                {(['jpeg', 'png', 'webp'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => updateOptions('output', { format })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      options.output.format === format
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 회전 각도 */}
            {options.rotate.degrees !== 0 && (
              <div>
                <label className="block text-sm mb-2 text-gray-400">회전 각도</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => updateOptions('rotate', { degrees: deg })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        options.rotate.degrees === deg
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 크롭 비율 */}
            {options.crop.enabled && (
              <div>
                <label className="block text-sm mb-2 text-gray-400">잘라내기 비율</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['free', '1:1', '4:3', '16:9'] as const).map((aspect) => (
                    <button
                      key={aspect}
                      onClick={() => updateOptions('crop', { aspect })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        options.crop.aspect === aspect
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {aspect === 'free' ? '자유' : aspect}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 추가 옵션 */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer hover:text-white p-3 rounded-lg hover:bg-gray-800 transition-all">
              <input
                type="checkbox"
                checked={options.flags.stripMetadata}
                onChange={(e) => updateOptions('flags', { stripMetadata: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span>메타데이터 제거 (EXIF)</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer hover:text-white p-3 rounded-lg hover:bg-gray-800 transition-all">
              <input
                type="checkbox"
                checked={options.naming.keepOriginal}
                onChange={(e) => updateOptions('naming', { keepOriginal: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span>원본 파일명 유지</span>
            </label>
          </div>
        </div>

        {/* 장점 강조 */}
        <div className="mt-6 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            왜 우리 앱을 선택해야 할까요?
          </h4>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>100% 로컬 처리</strong> - 서버 업로드 없음, 개인정보 보호</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>초고속 처리</strong> - 인터넷 속도에 영향 없음</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>무제한 사용</strong> - 파일 크기/개수 제한 없음</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>AI 업스케일</strong> - 해상도 향상 기술</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
