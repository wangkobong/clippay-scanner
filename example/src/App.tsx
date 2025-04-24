import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { multiply, PassportScanScreen } from 'react-native-clippay-scanner';
import type { ScanDocumentResponse } from 'react-native-clippay-scanner';

// 서버 URL 설정
const SERVER_URL = 'https://your-server-api.com'; // 실제 서버 URL로 변경 필요
const USER_ID = 'test_user123'; // 사용자 ID
const COUNTRY_CODE = 'KR'; // 국가 코드 (선택 사항)

const App = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<ScanDocumentResponse | null>(null);
  const result = multiply(3, 7);

  const handleBack = () => {
    setShowScanner(false);
  };

  const handleImageCaptured = (imageUri: string) => {
    console.log('캡처된 이미지 경로:', imageUri);
  };

  const handleScanComplete = (result: ScanDocumentResponse) => {
    console.log('스캔 결과:', result);
    setScanResult(result);
    // 스캔 결과 처리 로직
  };

  const renderScanResult = () => {
    if (!scanResult) return null;
    
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>스캔 결과</Text>
        <Text style={styles.resultText}>응답 코드: {scanResult.resCd}</Text>
        <Text style={styles.resultText}>응답 메시지: {scanResult.resMsg}</Text>
        {scanResult.ocrName && (
          <Text style={styles.resultText}>이름: {scanResult.ocrName}</Text>
        )}
        {scanResult.ocrNumber && (
          <Text style={styles.resultText}>번호: {scanResult.ocrNumber}</Text>
        )}
        {scanResult.ocrBirthDay && (
          <Text style={styles.resultText}>생년월일: {scanResult.ocrBirthDay}</Text>
        )}
        {scanResult.ocrExpireDate && (
          <Text style={styles.resultText}>만료일: {scanResult.ocrExpireDate}</Text>
        )}
        {scanResult.ocrAddress && (
          <Text style={styles.resultText}>주소: {scanResult.ocrAddress}</Text>
        )}
      </View>
    );
  };

  if (showScanner) {
    return (
      <PassportScanScreen 
        serverUrl={SERVER_URL} 
        userId={USER_ID}
        countryCode={COUNTRY_CODE}
        onBack={handleBack} 
        onImageCaptured={handleImageCaptured}
        onScanComplete={handleScanComplete}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClippayScanner 예제</Text>
      <Text style={styles.subtitle}>multiply 함수 결과: {result}</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setShowScanner(true)}
      >
        <Text style={styles.buttonText}>문서 스캔 시작</Text>
      </TouchableOpacity>

      {renderScanResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 5,
  }
});

export default App;
