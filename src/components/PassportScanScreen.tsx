import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
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

// 화면 크기
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 문서 유형 정의
export type DocumentType = {
  id: string;
  name: string;
  isPassportType: boolean;
};

const documentTypes: DocumentType[] = [
  { id: '01', name: '국내여권', isPassportType: true },
  { id: '10', name: '해외여권', isPassportType: true },
  { id: '02', name: '주민등록증', isPassportType: false },
  { id: '03', name: '운전면허증', isPassportType: false },
  { id: '04', name: '신용카드', isPassportType: false },
];

interface PassportScanScreenProps {
  serverUrl: string;
  onBack?: () => void;
  onImageCaptured?: (imageUri: string, documentType: DocumentType) => void;
}

export function PassportScanScreen({
  serverUrl,
  onBack,
  onImageCaptured,
}: PassportScanScreenProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [camera, setCamera] = useState<Camera | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType>(documentTypes[0] as DocumentType);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [frameCoords, setFrameCoords] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 프레임 좌표 계산
  useEffect(() => {
    const frameWidth = screenWidth * 0.85; // 85%
    const frameHeight = selectedDocumentType.isPassportType
      ? screenHeight * 0.5 // 여권: 50%
      : screenHeight * 0.3; // 신분증: 30%
    const x = (screenWidth - frameWidth) / 2; // 중앙 정렬
    const y = (screenHeight - frameHeight) / 2; // 중앙 정렬

    setFrameCoords({ x, y, width: frameWidth, height: frameHeight });
  }, [selectedDocumentType]);

  const checkPermission = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      }
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const takePicture = async () => {
    if (camera && frameCoords) {
      try {
        const photo = await camera.takePhoto({
          flash: 'off',
        });
        const imagePath = `file://${photo.path}`;
        console.log('원본 사진 경로:', imagePath);

        // 프레임 영역 크롭
        const croppedImage = await ImagePicker.openCropper({
          path: imagePath.replace('file://', ''),
          width: Math.round(frameCoords.width),
          height: Math.round(frameCoords.height),
          cropperActiveWidgetColor: '#007AFF',
          cropperStatusBarColor: '#000',
          cropperToolbarColor: '#000',
          includeBase64: false,
          mediaType: 'photo',
        });

        // 검정색 배경 캔버스에 크롭된 이미지 합성
        const finalImage = await ImagePicker.openCropper({
          path: croppedImage.path,
          width: Math.round(screenWidth),
          height: Math.round(screenHeight),
          cropping: true,
          cropperActiveWidgetColor: '#007AFF',
          cropperStatusBarColor: '#000',
          cropperToolbarColor: '#000',
          includeBase64: false,
          mediaType: 'photo',
        });

        setCapturedImage(finalImage.path);
        console.log('최종 이미지 경로:', finalImage.path);

        // 외부로 최종 이미지 전달
        if (onImageCaptured && typeof onImageCaptured === 'function') {
          onImageCaptured(finalImage.path, selectedDocumentType);
        }
      } catch (e) {
        console.error('사진 촬영 또는 처리 실패:', e);
        Alert.alert('오류', '사진 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const uploadImage = async () => {
    if (!capturedImage) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: capturedImage,
        type: 'image/jpeg',
        name: `document_${selectedDocumentType.id}.jpg`,
      });
      formData.append('documentType', selectedDocumentType.id);

      const uploadUrl = `${serverUrl}/upload`;
      console.log('업로드 URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('성공', '문서 이미지가 성공적으로 업로드되었습니다.', [
          { text: '확인', onPress: onBack },
        ]);
      } else {
        Alert.alert('오류', result.message || '업로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetImage = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const toggleTypeSelector = useCallback(() => {
    setShowTypeSelector((prev) => !prev);
  }, []);

  const selectDocumentType = useCallback((documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowTypeSelector(false);
  }, []);

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>뒤로</Text>
        </TouchableOpacity>
      )}

      {!hasPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>권한 요청</Text>
          </TouchableOpacity>
        </View>
      ) : !device ? (
        <View style={styles.container}>
          <Text style={styles.text}>카메라를 사용할 수 없습니다</Text>
        </View>
      ) : capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.preview} />
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>서버로 전송 중...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={resetImage}>
                <Text style={styles.buttonText}>다시 촬영</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={uploadImage}
              >
                <Text style={styles.buttonText}>서버로 전송</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <Camera
            ref={(ref) => setCamera(ref)}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
          <View style={styles.overlay}>
            {/* 상단 마스크 */}
            <View
              style={[
                styles.maskSection,
                {
                  height: selectedDocumentType.isPassportType ? '25%' : '35%',
                  top: 0,
                  left: 0,
                  right: 0,
                },
              ]}
            />
            {/* 왼쪽 마스크 */}
            <View
              style={[
                styles.maskSection,
                {
                  top: selectedDocumentType.isPassportType ? '25%' : '35%',
                  bottom: selectedDocumentType.isPassportType ? '25%' : '35%',
                  left: 0,
                  width: '7.5%',
                },
              ]}
            />
            {/* 오른쪽 마스크 */}
            <View
              style={[
                styles.maskSection,
                {
                  top: selectedDocumentType.isPassportType ? '25%' : '35%',
                  bottom: selectedDocumentType.isPassportType ? '25%' : '35%',
                  right: 0,
                  width: '7.5%',
                },
              ]}
            />
            {/* 하단 마스크 */}
            <View
              style={[
                styles.maskSection,
                {
                  height: selectedDocumentType.isPassportType ? '25%' : '35%',
                  bottom: 0,
                  left: 0,
                  right: 0,
                },
              ]}
            />
            {/* 프레임 테두리 */}
            <View
              style={[
                styles.documentFrame,
                selectedDocumentType.isPassportType
                  ? styles.passportFrame
                  : styles.cardFrame,
              ]}
            />
          </View>

          <View style={styles.documentTypeContainer}>
            <TouchableOpacity
              style={styles.documentTypeButton}
              onPress={toggleTypeSelector}
            >
              <Text style={styles.documentTypeText}>
                {selectedDocumentType.name} ▼
              </Text>
            </TouchableOpacity>
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

          <View style={styles.controlsContainer}>
            <Text style={styles.guideText}>
              {selectedDocumentType.isPassportType
                ? '여권을 프레임 안에 맞추어 주세요'
                : '문서를 프레임 안에 맞추어 주세요'}
            </Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentFrame: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  passportFrame: {
    width: '85%',
    height: '50%',
  },
  cardFrame: {
    width: '85%',
    height: '30%',
  },
  documentTypeContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  documentTypeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    maxHeight: 200,
    width: 200,
  },
  typeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedTypeText: {
    fontWeight: 'bold',
    color: '#007AFF',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
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
    flex: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  maskSection: {
    position: 'absolute',
    backgroundColor: '#000', // 불투명 검정색
  },
});

export default PassportScanScreen;
