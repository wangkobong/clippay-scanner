/**
 * 문서 유형 정의
 * isPassportType - 여권은 true, 다른 문서는 false
 */
export interface DocumentType {
  id: string;            // 문서 유형 식별자
  name: string;          // 문서 유형 이름 (화면에 표시)
  isPassportType: boolean; // 여권 유형 여부 (true: 여권, false: 기타 문서)
}

/**
 * 서버 요청 인터페이스
 */
export interface ScanDocumentRequest {
  mbUid: string;          // 회원ID
  ocrType: string;        // 이미지 종류 (01: 국내여권, 02: 주민등록증, 03: 운전면허, 04: 신용카드, 10: 해외여권)
  countryCode?: string;   // 국가 코드 (선택 사항)
  encData: string;        // BASE64로 인코딩된 이미지 파일
}

/**
 * OCR 저장 요청 인터페이스
 */
export interface SaveOcrRequest {
  mbUid: string;          // 회원ID
  ocrType: string;        // 이미지 종류 (01: 국내여권, 02: 주민등록증, 03: 운전면허, 04: 신용카드, 10: 해외여권)
  countryCode?: string;   // 국가 코드
  ocrNumber?: string;     // 번호 (여권번호, 주민번호 등)
  ocrBirthDay?: string;   // 생년월일 (YYYYMMDD)
  ocrName?: string;       // 이름
  ocrExpireDate?: string; // 유효기간/만료기간
  ocrAddress?: string;    // 주소
  ocrReserved?: string;   // 예약 필드
  encData: string;        // BASE64로 인코딩된 원본 이미지파일
}

/**
 * 서버 응답 인터페이스
 */
export interface ScanDocumentResponse {
  resCd: string;         // 응답 코드 ("0000": 정상응답, "9999": 기타오류)
  resMsg: string;        // 응답 메시지
  ocrNumber?: string;    // 번호 (여권번호, 주민번호 등)
  ocrBirthDay?: string;  // 생년월일 (YYYYMMDD)
  ocrName?: string;      // 이름
  ocrExpireDate?: string;// 유효기간/만료기간
  ocrAddress?: string;   // 주소
  ocrReserved?: string;  // 예약 필드
  ocrImage?: string;     // 마스킹 이미지
}

/**
 * 지원 문서 유형 목록
 */
export const documentTypes: DocumentType[] = [
  { id: '01', name: '국내여권', isPassportType: true },
  { id: '10', name: '해외여권', isPassportType: true },
  { id: '02', name: '주민등록증', isPassportType: false },
  { id: '03', name: '운전면허증', isPassportType: false },
  { id: '04', name: '신용카드', isPassportType: false },
]; 