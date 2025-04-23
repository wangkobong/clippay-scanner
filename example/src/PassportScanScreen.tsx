// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import React, { useState, useRef } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
// import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

// interface PassportScanScreenProps {
//   serverUrl: string;
//   onBack?: () => void;
// }

// export const PassportScanScreen: React.FC<PassportScanScreenProps> = ({ serverUrl, onBack }) => {
//   const { hasPermission, requestPermission } = useCameraPermission();
//   const device = useCameraDevice('back');
//   const camera = useRef<Camera>(null);
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   const checkPermission = async () => {
//     if (!hasPermission) {
//       const granted = await requestPermission();
//       if (!granted) {
//         Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
//       }
//     }
//   };

//   React.useEffect(() => {
//     checkPermission();
//   }, []);

//   const takePicture = async () => {
//     if (camera.current) {
//       try {
//         const photo = await camera.current.takePhoto({
//           flash: 'off',
//         });
        
//         setCapturedImage(`file://${photo.path}`);
//         console.log('사진 촬영 성공:', photo.path);
//       } catch (e) {
//         console.error('사진 촬영 실패:', e);
//       }
//     }
//   };

//   const uploadImage = async () => {
//     if (!capturedImage) return;
    
//     setLoading(true);
//     try {
//       // 이미지 파일을 FormData로 준비
//       const formData = new FormData();
//       formData.append('passport', {
//         uri: capturedImage,
//         type: 'image/jpeg',
//         name: 'passport.jpg',
//       });
      
//       // 전달받은 서버 URL 사용
//       const uploadUrl = `${serverUrl}/upload`;
//       console.log('업로드 URL:', uploadUrl);
      
//       const response = await fetch(uploadUrl, {
//         method: 'POST',
//         body: formData,
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
      
//       const result = await response.json();
      
//       if (response.ok) {
//         Alert.alert('성공', '여권 이미지가 성공적으로 업로드되었습니다.', [
//           { text: '확인', onPress: onBack }
//         ]);
//       } else {
//         Alert.alert('오류', result.message || '업로드 중 오류가 발생했습니다.');
//       }
//     } catch (error) {
//       console.error('업로드 오류:', error);
//       Alert.alert('오류', '네트워크 오류가 발생했습니다.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetImage = () => {
//     setCapturedImage(null);
//   };

//   return (
//     <View style={styles.container}>
//       {onBack && (
//         <TouchableOpacity style={styles.backButton} onPress={onBack}>
//           <Text style={styles.backButtonText}>뒤로</Text>
//         </TouchableOpacity>
//       )}
      
//       {!hasPermission ? (
//         <View style={styles.permissionContainer}>
//           <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
//           <TouchableOpacity style={styles.button} onPress={requestPermission}>
//             <Text style={styles.buttonText}>권한 요청</Text>
//           </TouchableOpacity>
//         </View>
//       ) : !device ? (
//         <View style={styles.container}>
//           <Text style={styles.text}>카메라를 사용할 수 없습니다</Text>
//         </View>
//       ) : capturedImage ? (
//         // 이미지 캡처 후 표시
//         <View style={styles.previewContainer}>
//           <Image source={{ uri: capturedImage }} style={styles.preview} />
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#007AFF" />
//               <Text style={styles.loadingText}>서버로 전송 중...</Text>
//             </View>
//           ) : (
//             <View style={styles.buttonContainer}>
//               <TouchableOpacity style={styles.button} onPress={resetImage}>
//                 <Text style={styles.buttonText}>다시 촬영</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={uploadImage}>
//                 <Text style={styles.buttonText}>서버로 전송</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       ) : (
//         // 카메라 표시
//         <View style={styles.cameraContainer}>
//           <Camera
//             ref={camera}
//             style={styles.camera}
//             device={device}
//             isActive={true}
//             photo={true}
//           />
//           {/* 마스크 오버레이 - 프레임 영역만 투명하게 보이도록 구현 */}
//           <View style={styles.overlay}>
//             {/* 상단 마스크 */}
//             <View style={styles.topMask} />
//             <View style={styles.middleSection}>
//               {/* 왼쪽 마스크 */}
//               <View style={styles.sideMask} />
//               {/* 가운데 투명 영역 (프레임) */}
//               <View style={styles.passportFrame} />
//               {/* 오른쪽 마스크 */}
//               <View style={styles.sideMask} />
//             </View>
//             {/* 하단 마스크 */}
//             <View style={styles.bottomMask} />
//           </View>
//           <View style={styles.controlsContainer}>
//             <Text style={styles.guideText}>여권을 프레임 안에 맞추어 주세요</Text>
//             <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
//               <View style={styles.captureButtonInner} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   backButton: {
//     position: 'absolute',
//     top: 40,
//     left: 20,
//     zIndex: 10,
//     padding: 10,
//   },
//   backButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   permissionText: {
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   cameraContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   camera: {
//     flex: 1,
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   passportFrame: {
//     width: '85%',
//     height: '100%',
//     borderWidth: 2,
//     borderColor: '#fff',
//     borderRadius: 10,
//     backgroundColor: 'transparent',
//   },
//   topMask: {
//     width: '100%',
//     height: '25%', // 상단 25% 차지
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   middleSection: {
//     width: '100%',
//     height: '50%', // 중간 50% 차지 (여권 프레임 영역)
//     flexDirection: 'row',
//   },
//   sideMask: {
//     width: '7.5%', // 양쪽 마스크 (100% - 85%) / 2 = 7.5%
//     height: '100%',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   bottomMask: {
//     width: '100%',
//     height: '25%', // 하단 25% 차지
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   controlsContainer: {
//     position: 'absolute',
//     bottom: 40,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   guideText: {
//     color: '#fff',
//     fontSize: 16,
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   captureButton: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   captureButtonInner: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#fff',
//   },
//   text: {
//     color: '#fff',
//     fontSize: 16,
//     textAlign: 'center',
//     marginTop: 20,
//   },
//   previewContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   preview: {
//     flex: 1,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.7)',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     marginTop: 10,
//   },
//   button: {
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//     minWidth: 120,
//     alignItems: 'center',
//   },
//   confirmButton: {
//     backgroundColor: '#34C759',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

// export default PassportScanScreen; 