import { Platform } from 'react-native';
import type { DocumentType, ScanDocumentRequest, ScanDocumentResponse, SaveOcrRequest } from '../models';

// 내부용 응답 인터페이스
interface UploadDocumentResponse {
  success: boolean;
  message?: string;
  data?: ScanDocumentResponse;
}

export class DocumentScanService {
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * 문서 이미지를 스캔하고 정보를 추출합니다
   * @param imagePath 이미지 파일 경로
   * @param documentType 문서 타입 정보
   * @param userId 사용자 ID
   * @param countryCode 국가 코드 (선택 사항)
   * @returns 서버 응답 객체
   */
  async scanDocument(
    imagePath: string,
    documentType: DocumentType,
    userId: string,
    countryCode?: string
  ): Promise<UploadDocumentResponse> {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      
      // 이미지 파일 첨부
      formData.append('document', {
        uri: this.normalizeFilePath(imagePath),
        type: 'image/jpeg',
        name: `document_${documentType.id}.jpg`,
      });
      
      // 요청 파라미터 추가
      formData.append('mbUid', userId);
      formData.append('ocrType', documentType.id);
      
      // 국가 코드가 제공된 경우에만 추가
      if (countryCode) {
        formData.append('countryCode', countryCode);
      }

      // API 엔드포인트 URL
      const apiUrl = `${this.serverUrl}/ocr/scan`;
      console.log('스캔 API URL:', apiUrl);

      // 서버로 데이터 전송
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      // 응답 처리
      const result: ScanDocumentResponse = await response.json();
      
      // 응답 결과 확인 및 반환
      const isSuccess = result.resCd === '0000';
      
      return {
        success: isSuccess,
        message: result.resMsg,
        data: isSuccess ? result : undefined
      };
    } catch (error) {
      console.error('문서 스캔 오류:', error);
      return {
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      };
    }
  }

  /**
   * OCR 정보를 서버에 저장합니다
   * @param ocrData OCR 데이터
   * @param imagePath 이미지 파일 경로 (필요한 경우)
   * @returns 서버 응답 객체
   */
  async saveOcrData(
    ocrData: {
      mbUid: string;
      ocrType: string;
      countryCode?: string;
      ocrNumber?: string;
      ocrBirthDay?: string;
      ocrName?: string;
      ocrExpireDate?: string;
      ocrAddress?: string;
      ocrReserved?: string;
    },
    imagePath: string
  ): Promise<UploadDocumentResponse> {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      
      // OCR 데이터 추가
      formData.append('mbUid', ocrData.mbUid);
      formData.append('ocrType', ocrData.ocrType);
      
      // 선택적 필드들 추가
      if (ocrData.countryCode) formData.append('countryCode', ocrData.countryCode);
      if (ocrData.ocrNumber) formData.append('ocrNumber', ocrData.ocrNumber);
      if (ocrData.ocrBirthDay) formData.append('ocrBirthDay', ocrData.ocrBirthDay);
      if (ocrData.ocrName) formData.append('ocrName', ocrData.ocrName);
      if (ocrData.ocrExpireDate) formData.append('ocrExpireDate', ocrData.ocrExpireDate);
      if (ocrData.ocrAddress) formData.append('ocrAddress', ocrData.ocrAddress);
      if (ocrData.ocrReserved) formData.append('ocrReserved', ocrData.ocrReserved);
      
      // 이미지 파일 첨부
      formData.append('document', {
        uri: this.normalizeFilePath(imagePath),
        type: 'image/jpeg',
        name: `document_${ocrData.ocrType}.jpg`,
      });

      // API 엔드포인트 URL
      const apiUrl = `${this.serverUrl}/ocr/save`;
      console.log('OCR 저장 API URL:', apiUrl);

      // 서버로 데이터 전송
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      // 응답 처리
      const result: ScanDocumentResponse = await response.json();
      
      // 응답 결과 확인 및 반환
      const isSuccess = result.resCd === '0000';
      
      return {
        success: isSuccess,
        message: result.resMsg,
        data: isSuccess ? result : undefined
      };
    } catch (error) {
      console.error('OCR 저장 오류:', error);
      return {
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      };
    }
  }
  
  /**
   * (구) 이미지 업로드 메서드 (호환성 유지)
   * @deprecated 새로운 scanDocument 메서드를 사용하세요
   */
  async uploadDocument(
    imagePath: string,
    documentType: DocumentType
  ): Promise<UploadDocumentResponse> {
    console.warn('uploadDocument는 더 이상 사용되지 않습니다. scanDocument를 사용하세요.');
    
    try {
      // FormData 객체 생성 및 이미지 첨부
      const formData = new FormData();
      formData.append('document', {
        uri: imagePath, // 이미지 경로
        type: 'image/jpeg', // 이미지 타입
        name: `document_${documentType.id}.jpg`, // 파일명
      });
      
      // 문서 유형 ID 첨부
      formData.append('documentType', documentType.id);

      // 업로드 URL 설정
      const uploadUrl = `${this.serverUrl}/upload`;
      console.log('업로드 URL:', uploadUrl);

      // 서버로 이미지 전송
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 응답 처리
      const result = await response.json();
      
      return {
        success: response.ok,
        message: result.message,
        data: result.data
      };
    } catch (error) {
      console.error('업로드 오류:', error);
      return {
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      };
    }
  }
  
  /**
   * 파일 경로를 플랫폼에 맞게 정규화합니다
   * @private
   * @param path 파일 경로
   * @returns 정규화된 파일 경로
   */
  private normalizeFilePath(path: string): string {
    // iOS에서는 file:// 프리픽스가 필요할 수 있음
    if (Platform.OS === 'ios' && !path.startsWith('file://')) {
      return `file://${path}`;
    }
    return path;
  }
} 