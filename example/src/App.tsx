import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { multiply, PassportScanScreen } from 'react-native-clippay-scanner';

// 서버 URL 설정
const SERVER_URL = 'https://your-server-api.com'; // 실제 서버 URL로 변경 필요

const App = () => {
  const [showScanner, setShowScanner] = React.useState(false);
  const result = multiply(3, 7);

  const handleBack = () => {
    setShowScanner(false);
  };

  const handleImageCaptured = (imageUri: string) => {
    console.log('캡처된 이미지 경로:', imageUri);
  };

  if (showScanner) {
    return (
      <PassportScanScreen 
        serverUrl={SERVER_URL} 
        onBack={handleBack} 
        onImageCaptured={handleImageCaptured}
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
        <Text style={styles.buttonText}>여권 스캔 시작</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
