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
} from 'react-native';

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
    NativeModules.LivenessModule.initSDKByLicense('Indonesia', false);

    const token = await fetchToken();

    const signatureId = await fetchSignatureId(token);

    if (!token) return;

    const response = await fetchLicense(token);

    const license = response.data.license;

    // NativeModules.LivenessModule.bindUser("your user id")
    NativeModules.LivenessModule.set3DLivenessTimeoutMills(5000);
    // NativeModules.LivenessModule.setVideoRecorderConfig(true, 60);
    NativeModules.LivenessModule.isDetectOcclusion(true);

    if (signatureId) {
      NativeModules.LivenessModule.setSignatureId(signatureId);
    }

    NativeModules.LivenessModule.setLicenseAndCheck(
      license,
      successCode => {
        console.log('Success: ' + successCode);

        NativeModules.LivenessModule.startLiveness(
          successJsonData => {
            const livenessId = successJsonData.livenessId;
            const imageBase64 = successJsonData.livenessBase64Str;
      

            fetchScoring(token, signatureId, livenessId, imageBase64);

            // const payload = {
            //   livenessId: livenessId,
            //   signatureId: signatureId,
            //   resultType: imageBase64,
            // };

            // fetch(
            //   'https://api.advance.ai/openapi/liveness/v3/detection-result',
            //   {
            //     method: 'POST',
            //     headers: {
            //       'X-ACCESS-TOKEN': token,
            //       'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(payload),
            //   },
            // )
            //   .then(response => response.json())
            //   .then(data => {
            //     console.log('Response Scoring:', data);
            //   })
            //   .catch(error => {
            //     console.error('Fetch Error:', error);
            //   });
          },
          failedJsonData => {
            console.log('Failed Liveness: ' + JSON.stringify(failedJsonData));
          },
        );
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
            applicationId: 'com.myprojectadvance',
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
