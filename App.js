import { SHA256 } from 'crypto-js';
import React, { useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  NativeModules,
  Platform,
} from 'react-native';
import AAIIOSLivenessSDK from 'react-native-aaiios-liveness-sdk';
import { RNCamera } from 'react-native-camera';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { captureRef } from 'react-native-view-shot';
import RNFetchBlob from 'rn-fetch-blob';

const App = () => {
  const cameraRef = useRef(null);

  const App = () => {
    const cameraRef = useRef(null);
    const viewRef = useRef(null);
    const devices = useCameraDevices();
    const device = devices.back;
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
      (async () => {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'authorized');
      })();
    }, []);

    const onVerifyKTP = async () => {
      try {
        if (!cameraRef.current) return;

        const snapshot = await cameraRef.current.takePhoto({
          qualityPrioritization: 'balanced',
        });

        const photoPath = snapshot.path;
        const token = await fetchToken();

        const response = await RNFetchBlob.fetch(
          'POST',
          'https://api.advance.ai/openapi/face-recognition/v3/ocr-ktp-check',
          {
            'Content-Type': 'multipart/form-data',
            'X-ACCESS-TOKEN': token,
          },
          [
            {
              name: 'ocrImage',
              filename: 'ktp.jpg',
              type: 'image/jpeg',
              data: RNFetchBlob.wrap(photoPath),
            },
          ],
        );

        const data = JSON.parse(response.data);
        console.log('OCR Result:', data);
      } catch (err) {
        console.error('Upload Error:', err);
      }
    };

    const onVerifyLiveness = async () => {
      const isIos = Platform.OS === 'ios';
      const market = isIos ? 'AAILivenessMarketIndonesia' : 'Indonesia';
      const sdkLiveness = isIos
        ? AAIIOSLivenessSDK
        : NativeModules.LivenessModule;

      if (isIos) {
        AAIIOSLivenessSDK.sdkVersion(message => {
          console.log('SDK version is ', message);
        });
      }
      sdkLiveness.initSDKByLicense(market, false);

      const token = await fetchToken();
      const signatureId = await fetchSignatureId(token);
      if (!token) return;

      const response = await fetchLicense(token);
      const license = response.data.license;

      if (isIos) {
        AAIIOSLivenessSDK.setActionTimeoutSeconds(5);
        AAIIOSLivenessSDK.setDetectOcclusion(true);
      } else {
        NativeModules.LivenessModule.set3DLivenessTimeoutMills(5000);
        NativeModules.LivenessModule.isDetectOcclusion(true);
      }

      if (signatureId && !isIos) {
        sdkLiveness.setSignatureId(signatureId);
      }

      sdkLiveness.setLicenseAndCheck(
        license,
        successCode => {
          console.log('Success: ' + successCode);

          if (isIos) {
            startLivenessIOS(token, signatureId);
          } else {
            startLivenessAndroid(token, signatureId);
          }
        },
        errorCode => {
          console.error('Error: ' + errorCode);
        },
      );
    };

    const fetchLicense = async token => {
      try {
        const response = await fetch(
          'https://api.advance.ai/openapi/liveness/v1/auth-license',
          {
            method: 'POST',
            headers: {
              'X-ACCESS-TOKEN': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              licenseEffectiveSeconds: 600,
              applicationId:
                Platform.OS === 'ios'
                  ? 'org.reactjs.native.example.MyProjectAdvance'
                  : 'com.myprojectadvance',
            }),
          },
        );

        const data = await response.json();
        console.log('Response:', data);
        return data;
      } catch (error) {
        console.error('Fetch Error:', error);
      }
    };

    const fetchScoring = async (token, signatureId, livenessId, base64image) => {
      try {
        const payload = {
          livenessId: livenessId,
          signatureId: signatureId,
          resultType: 'IMAGE_BASE64',
        };
        const response = await fetch(
          'https://api.advance.ai/openapi/liveness/v3/detection-result',
          {
            method: 'POST',
            headers: {
              'X-ACCESS-TOKEN': token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );
        const dataRaw = await response.json();
        console.log('Response Scoring:', dataRaw);
        return dataRaw.data.livenessScore;
      } catch (error) {
        console.error('Fetch Error:', error);
      }
    };

    const fetchToken = async () => {
      try {
        const secretKey = '5f463360c65fbbb7';
        const accessKey = 'b5008258bdd8a455';
        const timestamp = (Date.now() + 300).toString();
        const rawSignature = accessKey + secretKey + timestamp;
        const signature = SHA256(rawSignature).toString();

        const payload = {
          accessKey,
          signature,
          timestamp,
          periodSecond: 3600,
        };

        const response = await fetch(
          'https://api.advance.ai/openapi/auth/ticket/v1/generate-token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );
        const dataRaw = await response.json();
        console.log('Response Token:', dataRaw.data.token);
        return dataRaw.data.token;
      } catch (error) {
        console.error('Fetch Error:', error);
        return null;
      }
    };

    const fetchSignatureId = async token => {
      try {
        const response = await fetch(
          'https://api.advance.ai/liveness/ext/v1/generate-signature-id',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-ACCESS-TOKEN': token,
            },
          },
        );
        const dataRaw = await response.json();
        console.log('Response Signature:', dataRaw.data.signatureId);
        return dataRaw.data.signatureId;
      } catch (error) {
        console.error('Fetch Error:', error);
        return null;
      }
    };

    const startLivenessIOS = (token, signatureId) => {
      const config = {};
      const callback = {
        onCameraPermissionDenied: (errorKey, errorMessage) => {
          console.log('>>>>> onCameraPermissionDenied', errorKey, errorMessage);
        },
        onDetectionComplete: (livenessId, base64Img, additionalInfo) => {
          console.log('>>>>> onDetectionComplete:', additionalInfo);
          fetchScoring(token, signatureId, livenessId, base64Img);
        },
        onDetectionFailed: (errorCode, errorMessage, additionalInfo) => {
          console.log('>>>>> onDetectionFailed:', errorCode, errorMessage);
          console.log('additionalInfo:', additionalInfo);
        },
      };
      AAIIOSLivenessSDK.startLiveness(config, callback);
    };

    const startLivenessAndroid = (token, signatureId) => {
      NativeModules.LivenessModule.startLiveness(
        successJsonData => {
          const livenessId = successJsonData.livenessId;
          const imageBase64 = successJsonData.livenessBase64Str;

          fetchScoring(token, signatureId, livenessId, imageBase64);
        },
        failedJsonData => {
          console.log('Failed Liveness: ' + JSON.stringify(failedJsonData));
        },
      );
    };

    return (
      <SafeAreaView style={styles.container}>
        {device != null && hasPermission && (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
          />
        )}
        <View style={styles.buttonWrapper}>
          <Button title="Verify Liveness" onPress={onVerifyLiveness} />
          <View style={styles.spacing} />
          <Button title="Ambil Foto & Upload OCR KTP" onPress={onVerifyKTP} />
        </View>
      </SafeAreaView>
    );
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  spacing: {
    height: 16,
  },
});

export default App;
