import {SHA256} from 'crypto-js';
import React from 'react';
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

const Section = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App = () => {
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

    // sdkLiveness.bindUser("your user id")

    if (isIos) {
      AAIIOSLivenessSDK.setActionTimeoutSeconds(5);
      AAIIOSLivenessSDK.setDetectOcclusion(true);
    } else {
      NativeModules.LivenessModule.set3DLivenessTimeoutMills(5000);
      NativeModules.LivenessModule.isDetectOcclusion(true);
    }
    // sdkLiveness.setVideoRecorderConfig(true, 60);

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
          startLivenessAnroid(token, signatureId);
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
        // signatureId: signatureId,
        resultType: base64image,
      };
      console.log({payload});
      console.log({token});
      const response = await fetch(
        'https://api.advance.ai/openapi/liveness/v3/detection-result',
        {
          method: 'POST',
          headers: {
            'X-ACCESS-TOKEN': token,
            'Content-Type': 'application/json',
          },
          body: payload,
        },
      );
      const data = await response.json();
      console.log('Response Scoring:', data);
      return data;
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };

  const fetchToken = async () => {
    try {
      const secretKey = '5f463360c65fbbb7';
      const accessKey = 'b5008258bdd8a455';
      const timestamp = (Date.now() + 300).toString();

      console.log({timestamp});

      const rawSignature = accessKey + secretKey + timestamp;

      const signature = SHA256(rawSignature).toString();

      const payload = {
        accessKey,
        signature,
        timestamp,
        periodSecond: 3600,
      };

      console.log({payload});

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
    var config = {};
    var callback = {
      onCameraPermissionDenied: (errorKey, errorMessage) => {
        console.log('>>>>> onCameraPermissionDenied', errorKey, errorMessage);
        this.setState({message: errorMessage});
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

  const startLivenessAnroid = (token, signatureId) => {
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
    <SafeAreaView>
      <View>
        <Button title="Verify Liveness" onPress={onVerifyLiveness} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
