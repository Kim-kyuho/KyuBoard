# ImageCard 상세설계

소스: `components/ImageCard.tsx`, `hooks/useImageCard.ts`, `hooks/useBoardImages.ts`

## 역할

Cloudinary 이미지의 임시 미리보기, 표시, 이동, 크기 조절, 저장과 삭제를 담당한다.

## 모델

`imageId`, boardId, publicId, secureUrl, fileName, 선택적 File, x/y/z, width/height를 사용한다. File은 임시 카드에만 존재한다.

## 생성

1. hidden file input에서 파일을 받는다.
2. canvas에서 PNG로 재인코딩한다.
3. 최대 2000px로 줄이고 4MiB를 넘으면 가로·세로를 85%씩 반복 축소한다.
4. 최대 400 x 300의 표시 크기와 화면 중앙 좌표를 계산한다.
5. Object URL과 음수 ID의 임시 카드를 만들고 편집 상태로 둔다.
6. 빈 보드 pointerup 시 multipart POST로 Cloudinary와 DB에 저장한다.

저장 성공 시 Object URL을 해제하고 API image로 교체한다.

## 카드 동작

- Next Image `fill` + `object-contain`.
- 표시 상태는 이동/리사이즈 비활성.
- 더블 클릭/300ms 더블 탭으로 편집.
- 편집 상태는 전체 카드가 drag 대상이며 resize가 활성화된다.
- 좌표 최신값은 `imageStateRef`로 저장 callback에 전달한다.

## 외부 저장 차이

현재 이미지는 document pointerup이 빈 보드인지 확인한 뒤 `setTimeout(..., 0)`에서 저장하고 편집을 해제한다. 메모/Mermaid/표와 달리 pointerdown 시작 지점을 기록하지 않는다.

## 삭제

- 임시 이미지: Object URL 해제 후 로컬 제거.
- 저장 이미지: DELETE API가 Cloudinary asset과 DB 행을 제거한 뒤 로컬 제거.

