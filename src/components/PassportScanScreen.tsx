import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import ImagePicker from 'react-native-image-crop-picker';

// 화면 크기 - 전체 화면의 너비와 높이를 가져옵니다.
// 이 값들을 기준으로 캡처 영역의 크기를 계산합니다.
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 문서 유형 정의 - 여권은 isPassportType이 true, 다른 문서는 false
export type DocumentType = {
  id: string; // 문서 유형 식별자
  name: string; // 문서 유형 이름 (화면에 표시)
  isPassportType: boolean; // 여권 유형 여부 (true: 여권, false: 기타 문서)
};

// 지원되는 문서 유형 목록
const documentTypes: DocumentType[] = [
  { id: '01', name: '국내여권', isPassportType: true },
  { id: '10', name: '해외여권', isPassportType: true },
  { id: '02', name: '주민등록증', isPassportType: false },
  { id: '03', name: '운전면허증', isPassportType: false },
  { id: '04', name: '신용카드', isPassportType: false },
];

// 컴포넌트 Props 인터페이스
interface PassportScanScreenProps {
  serverUrl: string; // 이미지를 업로드할 서버 URL
  onBack?: () => void; // 뒤로가기 버튼 클릭 시 실행할 함수
  onImageCaptured?: (imageUri: string, documentType: DocumentType) => void; // 이미지 캡처 후 실행할 콜백
}

export function PassportScanScreen({
  serverUrl,
  onBack,
  onImageCaptured,
}: PassportScanScreenProps) {
  // 카메라 권한 관련 훅
  const { hasPermission, requestPermission } = useCameraPermission();
  // 후면 카메라 디바이스 가져오기
  const device = useCameraDevice('back');
  // 카메라 ref 저장용 state
  const [camera, setCamera] = useState<Camera | null>(null);
  // 로딩 상태 관리
  const [loading, setLoading] = useState(false);
  // 선택된 문서 유형 (기본값: 국내여권)
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType>(documentTypes[0] as DocumentType);
  // 문서 유형 선택기 표시 여부
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  // 프레임(캡처 영역) 좌표 및 크기
  const [frameCoords, setFrameCoords] = useState<{
    x: number; // 프레임 좌측 상단 x 좌표
    y: number; // 프레임 좌측 상단 y 좌표
    width: number; // 프레임 너비
    height: number; // 프레임 높이
  } | null>(null);

  // 프레임 좌표 계산 - 문서 유형이 변경될 때마다 재계산됩니다.
  useEffect(() => {
    // 문서 종류에 따라 정확한 비율 계산
    // 국제 표준 여권 비율: 125mm × 88mm ≈ 1.4:1
    // 일반적인 신분증 비율: 85mm × 54mm ≈ 1.6:1
    const aspectRatio = selectedDocumentType.isPassportType
      ? 1.4 // 여권 비율 (가로:세로 = 125mm:88mm ≈ 1.4:1)
      : 1.6; // 신분증 비율 (가로:세로 = 8.5cm:5.4cm ≈ 1.6:1)

    // 화면 너비의 85%로 프레임 너비 설정 (화면에 여백 남김)
    const frameWidth = screenWidth * 0.85;
    // 계산된 비율에 맞게 프레임 높이 계산
    // 비율 = 너비/높이 이므로, 높이 = 너비/비율
    const frameHeight = frameWidth / aspectRatio;

    // 화면 중앙에 프레임 위치시키기 위한 좌표 계산
    const x = (screenWidth - frameWidth) / 2; // 화면 중앙에 배치
    const y = (screenHeight - frameHeight) / 2; // 화면 중앙에 배치

    // 프레임 좌표 및 크기 설정
    setFrameCoords({
      x,
      y,
      width: frameWidth,
      height: frameHeight,
    });
  }, [selectedDocumentType]); // 문서 유형이 변경될 때마다 실행

  // 카메라 권한 확인 및 요청 함수
  const checkPermission = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      }
    }
  }, [hasPermission, requestPermission]);

  // 컴포넌트 마운트 시 카메라 권한 확인
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // 사진 촬영 함수 - 중요! 캡처 영역과 관련된 핵심 로직
  const takePicture = async () => {
    if (camera && frameCoords) {
      try {
        // 1. 전체 화면 사진 촬영
        const photo = await camera.takePhoto({
          flash: 'off',
        });
        // file:// 접두사가 중복되지 않도록 수정
        const imagePath = photo.path;
        console.log('원본 사진 경로:', imagePath);

        // 2. 촬영된 전체 이미지에서 프레임 영역만 크롭
        ImagePicker.openCropper({
          path: imagePath, // 이미 경로가 완전한 형태이므로 접두사 제거 불필요
          width: Math.round(frameCoords.width), // 프레임 너비로 크롭
          height: Math.round(frameCoords.height), // 프레임 높이로 크롭
          cropperActiveWidgetColor: '#007AFF', // 크롭 UI 활성 색상
          cropperStatusBarColor: '#000', // 상태바 색상
          cropperToolbarColor: '#000', // 툴바 색상
          includeBase64: false, // base64 인코딩 불필요
          mediaType: 'photo', // 미디어 유형: 사진
          // 비율을 고정하여 변형되지 않도록 설정하는 옵션들
          cropperChooseText: '확인', // 선택 버튼 텍스트
          cropperCancelText: '취소', // 취소 버튼 텍스트
          freeStyleCropEnabled: false, // 자유로운 비율 변경 비활성화
          showCropGuidelines: true, // 크롭 가이드라인 표시
          cropperToolbarTitle: '문서 영역 확인', // 툴바 제목
        })
          .then((croppedImage) => {
            console.log('크롭된 이미지 경로:', croppedImage.path);

            // 외부 콜백 함수 호출 (있는 경우)
            if (onImageCaptured && typeof onImageCaptured === 'function') {
              onImageCaptured(croppedImage.path, selectedDocumentType);
            }

            // 크롭된 이미지를 바로 서버로 업로드
            uploadImage(croppedImage.path);
          })
          .catch((e) => {
            // 사용자가 취소한 경우 또는 오류 발생
            console.log('사용자가 취소했거나 오류 발생:', e);
          });
      } catch (e) {
        console.error('사진 촬영 또는 처리 실패:', e);
        Alert.alert('오류', '사진 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 이미지 업로드 함수 - 크롭된 이미지 경로를 직접 받음
  const uploadImage = async (imagePath: string) => {
    setLoading(true); // 로딩 시작

    try {
      // FormData 객체 생성 및 이미지 첨부
      const formData = new FormData();
      formData.append('document', {
        uri: imagePath, // 이미지 경로
        type: 'image/jpeg', // 이미지 타입
        name: `document_${selectedDocumentType.id}.jpg`, // 파일명
      });
      // 문서 유형 ID 첨부
      formData.append('documentType', selectedDocumentType.id);

      // 업로드 URL 설정
      const uploadUrl = `${serverUrl}/upload`;
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

      // 성공 또는 실패 알림
      if (response.ok) {
        Alert.alert('성공', '문서 이미지가 성공적으로 업로드되었습니다.', [
          { text: '확인', onPress: onBack }, // 확인 버튼 클릭 시 뒤로 가기
        ]);
      } else {
        Alert.alert('오류', result.message || '업로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 문서 유형 선택기 토글 함수
  const toggleTypeSelector = useCallback(() => {
    setShowTypeSelector((prev) => !prev);
  }, []);

  // 문서 유형 선택 함수
  const selectDocumentType = useCallback((documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowTypeSelector(false); // 선택 후 선택기 닫기
  }, []);

  // 화면 렌더링
  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      )}

      {/* 카메라 권한이 없는 경우 - 권한 요청 화면 */}
      {!hasPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>권한 요청</Text>
          </TouchableOpacity>
        </View>
      ) : /* 카메라를 사용할 수 없는 경우 */
      !device ? (
        <View style={styles.container}>
          <Text style={styles.text}>카메라를 사용할 수 없습니다</Text>
        </View>
      ) : (
        /* 카메라 촬영 화면 */
        <View style={styles.cameraContainer}>
          {/* 로딩 오버레이 */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>서버로 전송 중...</Text>
            </View>
          )}

          {/* 카메라 컴포넌트 */}
          <Camera
            ref={(ref) => setCamera(ref)} // 카메라 참조 설정
            style={styles.camera}
            device={device}
            isActive={!loading} // 로딩 중에는 카메라 비활성화
            photo={true}
          />
          {/* 오버레이 - 캡처 영역 표시 */}
          <View style={styles.overlay}>
            {frameCoords && (
              <>
                {/* 상단 마스크 - 프레임 위쪽 영역 */}
                <View
                  style={[
                    styles.maskSection,
                    {
                      height: frameCoords.y,
                      top: 0,
                      left: 0,
                      right: 0,
                    },
                  ]}
                />
                {/* 왼쪽 마스크 - 프레임 왼쪽 영역 */}
                <View
                  style={[
                    styles.maskSection,
                    {
                      top: frameCoords.y,
                      bottom:
                        screenHeight - (frameCoords.y + frameCoords.height),
                      left: 0,
                      width: frameCoords.x,
                    },
                  ]}
                />
                {/* 오른쪽 마스크 - 프레임 오른쪽 영역 */}
                <View
                  style={[
                    styles.maskSection,
                    {
                      top: frameCoords.y,
                      bottom:
                        screenHeight - (frameCoords.y + frameCoords.height),
                      right: 0,
                      width: frameCoords.x,
                    },
                  ]}
                />
                {/* 하단 마스크 - 프레임 아래쪽 영역 */}
                <View
                  style={[
                    styles.maskSection,
                    {
                      height:
                        screenHeight - (frameCoords.y + frameCoords.height),
                      bottom: 0,
                      left: 0,
                      right: 0,
                    },
                  ]}
                />
                {/* 프레임 테두리 - 캡처 영역 테두리 */}
                <View
                  style={[
                    styles.documentFrame,
                    {
                      width: frameCoords.width,
                      height: frameCoords.height,
                      position: 'absolute',
                      top: frameCoords.y,
                      left: frameCoords.x,
                    },
                  ]}
                />
              </>
            )}
          </View>

          {/* 문서 유형 선택기 */}
          <View style={styles.documentTypeContainer}>
            <TouchableOpacity
              style={styles.documentTypeButton}
              onPress={toggleTypeSelector}
              disabled={loading}
            >
              <Text style={styles.documentTypeText}>
                {selectedDocumentType.name} ▼
              </Text>
            </TouchableOpacity>
            {/* 문서 유형 목록 (펼쳐진 경우에만 표시) */}
            {showTypeSelector && (
              <View style={styles.typeSelector}>
                <ScrollView>
                  {documentTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={styles.typeOption}
                      onPress={() => selectDocumentType(type)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          selectedDocumentType.id === type.id &&
                            styles.selectedTypeText,
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 하단 컨트롤 영역 - 안내 텍스트 및 촬영 버튼 */}
          <View style={styles.controlsContainer}>
            <Text style={styles.guideText}>
              {selectedDocumentType.isPassportType
                ? '여권을 프레임 안에 맞추어 주세요'
                : '문서를 프레임 안에 맞추어 주세요'}
            </Text>
            {/* 촬영 버튼 */}
            <TouchableOpacity
              style={[styles.captureButton, loading && styles.disabledButton]}
              onPress={takePicture}
              disabled={loading}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // 전체 화면 차지
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentFrame: {
    borderWidth: 2, // 테두리 두께
    borderColor: '#fff', // 테두리 색상
    borderRadius: 10, // 모서리 둥글기
    overflow: 'hidden', // 내부 콘텐츠가 경계를 넘지 않도록
    backgroundColor: 'transparent', // 배경 투명
  },
  documentTypeContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10, // 다른 요소 위에 표시
  },
  documentTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 반투명 배경
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  documentTypeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeSelector: {
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 반투명 배경
    borderRadius: 10,
    maxHeight: 200, // 최대 높이
    width: 200,
  },
  typeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)', // 옵션 구분선
  },
  typeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedTypeText: {
    fontWeight: 'bold',
    color: '#007AFF', // 선택된 항목 강조 색상
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35, // 원형 버튼
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // 반투명 테두리
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30, // 내부 원형
    backgroundColor: '#fff', // 흰색 내부
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1, // 이미지가 전체 화면 차지
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // 반투명 배경
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF', // 파란색 버튼
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#34C759', // 녹색 버튼 (확인용)
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  maskSection: {
    position: 'absolute',
    backgroundColor: '#000', // 검정색 마스크 (불투명)
  },
  disabledButton: {
    opacity: 0.5, // 비활성화된 버튼 투명도 적용
  },
});

export default PassportScanScreen;
