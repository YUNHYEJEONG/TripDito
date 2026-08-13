# 이미지 상품 분석 설정

사진 추가 화면은 서버에서 이미지 분석을 시도하고, 분석 서비스가 연결되지
않았거나 실패하면 **파일명 상품 초안**으로 전환합니다. 파일명 초안은 이미지
픽셀을 인식하지 않으며 이름·가격을 사용자가 직접 확인해야 합니다.

## 공급자 우선순위

1. `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini Vision
2. `OPENAI_API_KEY`: OpenAI Vision (Gemini 실패 또는 미설정 시)
3. `SERPAPI_API_KEY` + 아래 이미지 호스트 설정: Google Lens 후보 보강
4. 파일명 상품 초안

`OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `SERPAPI_API_KEY`는 모두
서버 전용입니다. `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다.

## Google Lens 이미지 전송

SerpAPI Google Lens는 공개 이미지 URL을 요구합니다. 사용자 사진을 외부에
업로드할 수 있으므로 SerpAPI 키만으로 Lens가 자동 활성화되지는 않습니다.

- 권장: `IMGBB_API_KEY`를 설정합니다.
- 임시 공개 호스트를 명시적으로 허용하려면
  `IMAGE_ANALYSIS_ENABLE_PUBLIC_IMAGE_HOST=true`를 설정합니다.

두 설정이 모두 없으면 Lens는 건너뛰고 Gemini/OpenAI가 data URL을 직접
분석합니다.

## 데모 카탈로그

`IMAGE_ANALYSIS_CATALOG_FALLBACK=true`는 이미지 인식 결과가 아닌 고정
카탈로그 추정을 사용합니다. 개발·프리뷰 전용이며 화면에 “데모 상품 추정”으로
표시됩니다. 운영 환경에서는 설정하지 않는 것을 권장합니다.

## 쿠팡 저가 비교

쿠팡 결과 검색은 `SERPAPI_API_KEY`를 사용합니다. 상품 등록 1시간 후 검색하며,
최신 공개 환율로 환산한 예상가보다 5% 이상 저렴한 경우에만 인앱 알림과 상품
카드에 표시합니다. 검색 키나 환율을 사용할 수 없을 때는 비교를 실패 상태로
종료하며 임의 환율로 알림을 만들지 않습니다.
