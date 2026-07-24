# AI 연동 가이드

MVP는 실제 AI API 없이 Mock으로 이미지를 상품 후보로 변환합니다.  
실제 연동 시 **UI·훅·저장 로직은 유지**하고 Analyzer 구현만 교체합니다.

## 교체 지점

| 파일 | 역할 |
|------|------|
| `features/image-analysis/port.ts` | `ImageAnalyzer` 인터페이스, `ProposedItem` 타입 |
| `features/image-analysis/mock-analyzer.ts` | 현재 기본 구현 |
| `features/image-upload/components/add-from-images-sheet.tsx` | `mockImageAnalyzer.analyze` 호출부 |

## 인터페이스

```ts
export interface ImageAnalyzer {
  analyze(images: AnalyzableImage[]): Promise<ProposedItem[]>;
}
```

`ProposedItem`은 최종 `ShoppingItem`이 아닙니다.  
사용자가 Sheet에서 확인·수정한 뒤 `itemRepository.createMany`로 저장합니다.

## 연동 절차

1. `features/image-analysis/api-analyzer.ts` 추가  
   - 서버 API(`/api/analyze` 등)로 `dataUrl` 또는 업로드 URL 전송  
   - 응답을 `ProposedItem[]`로 매핑
2. Sheet에서 import를 `apiImageAnalyzer`로 교체  
   - 또는 `config` 플래그로 Mock/API 전환
3. 환경 변수에 API 키·엔드포인트 추가 (클라이언트에 키를 두지 말 것)
4. 실패 UX: toast + 수동 등록 유도 유지

## 권장 API 경계

브라우저 → **자체 Next.js Route Handler** → 외부 Vision/LLM API

클라이언트가 외부 AI 키를 직접 쓰지 않도록 합니다.

## 이미지 전처리

업로드 시 `compress-image.ts`가 이미 리사이즈·JPEG 압축합니다.  
API 연동 후에도 이 단계를 유지해 페이로드·Local Storage 부담을 줄입니다.
