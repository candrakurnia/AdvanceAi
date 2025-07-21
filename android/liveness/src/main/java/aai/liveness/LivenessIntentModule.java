package aai.liveness;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;

import aai.liveness.Detector;
import aai.liveness.GuardianLivenessDetectionSDK;
import aai.liveness.LivenessImageData;
import aai.liveness.LivenessResult;
import aai.liveness.activity.LivenessActivity;
import aai.liveness.configs.AuditImageConfig;
import ai.advance.liveness.lib.Market;

/**
 * createTime:2019-10-30
 *
 * @author fan.zhang@advance.ai
 */
public class LivenessIntentModule extends ReactContextBaseJavaModule {
    private static final int REQUESTCODE_LIVENESS = 1110;
    private Callback mSuccessCallback, mErrorCallback;
    private ActivityEventListener mActivityEventListener = new ActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == LivenessIntentModule.REQUESTCODE_LIVENESS) {
                WritableNativeMap map = new WritableNativeMap();
                File videoFile = LivenessResult.getVideoFile(activity);
                if (videoFile != null) {
                    map.putString("videoFilePath", videoFile.getPath());
                }
                map.putString("eventId", LivenessResult.getEventId());
                map.putString("transactionId", LivenessResult.getTransactionId());
                map.putBoolean("isPay", LivenessResult.isPay());
                if (LivenessResult.isSuccess()) {
                    map.putString("livenessId", LivenessResult.getLivenessId());
                    map.putString("livenessBase64Str", LivenessResult.getLivenessBase64Str());
                    map.putString("nearImageBase64Str", LivenessResult.getNearBase64Str());

                    List<LivenessImageData> auditImageList = LivenessResult.getAuditImageList();
                    if (auditImageList != null) {
                        WritableNativeArray writableNativeArray = new WritableNativeArray();
                        for (int i = 0; i < auditImageList.size(); i++) {
                            LivenessImageData livenessImageData = auditImageList.get(i);
                            WritableNativeMap itemData = new WritableNativeMap();
                            itemData.putString("base64Image", livenessImageData.base64Image);
                            itemData.putDouble("timestamp", livenessImageData.timestamp);
                            writableNativeArray.pushMap(itemData);
                        }
                        map.putArray("auditImages", writableNativeArray);
                    }
                    if (mSuccessCallback != null) {
                        try {
                            mSuccessCallback.invoke(map);
                        } catch (Throwable t) {
                            StringWriter writer = new StringWriter();
                            PrintWriter printWriter = new PrintWriter(writer);
                            try {
                                t.printStackTrace(printWriter);
                                String exceptionMessage = writer.toString();
                                Log.e(getClass().getName(), exceptionMessage);
                            } catch (Exception ignored) {
                            }
                        }

                    }
                } else {
                    map.putString("errorCode", LivenessResult.getErrorCode());
                    map.putString("errorMsg", LivenessResult.getErrorMsg());
                    if (mErrorCallback != null) {
                        try {
                            mErrorCallback.invoke(map);
                        } catch (Throwable t) {
                            StringWriter writer = new StringWriter();
                            PrintWriter printWriter = new PrintWriter(writer);
                            try {
                                t.printStackTrace(printWriter);
                                String exceptionMessage = writer.toString();
                                Log.e(getClass().getName(), exceptionMessage);
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            }
        }

        @Override
        public void onNewIntent(Intent intent) {

        }
    };

    public LivenessIntentModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @Override
    public String getName() {
        return "LivenessModule";
    }

    @ReactMethod
    public void startLiveness(Callback successCallback, Callback errorCallback) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            this.mSuccessCallback = successCallback;
            this.mErrorCallback = errorCallback;
            Intent intent = new Intent(currentActivity, LivenessActivity.class);
            currentActivity.startActivityForResult(intent, REQUESTCODE_LIVENESS);
        }
    }

    @ReactMethod
    public void setAuditImageConfig(boolean collectionSwitch, int interval, int imageMaxNumber, int imageWidth, int quality) {
        GuardianLivenessDetectionSDK.setAuditImageConfig(new AuditImageConfig.AuditImageConfigBuilder()
                .setImageMaxNumber(imageMaxNumber)
                .setImageWidth(imageWidth)
                .setImageQuality(quality)
                .setImageCaptureInterval(interval)
                .setEnableCollectSwitch(collectionSwitch)
                .build());
    }

    @ReactMethod
    public void setVideoRecorderConfig(boolean recorderSwitch, int maxSeconds) {
        GuardianLivenessDetectionSDK.setRecordVideoSwitch(recorderSwitch);
        GuardianLivenessDetectionSDK.setMaxRecordVideoSeconds(maxSeconds);
    }

    @ReactMethod
    public void initSDKByKey(String accessKey, String secretKey, String market, boolean isGlobalService) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            GuardianLivenessDetectionSDK.init(getCurrentActivity().getApplication(), accessKey, secretKey, Market.valueOf(market), isGlobalService);
        }
        GuardianLivenessDetectionSDK.letSDKHandleCameraPermission();
    }

    @ReactMethod
    public void initSDKByLicense(String market, boolean isGlobalService) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            GuardianLivenessDetectionSDK.init(getCurrentActivity().getApplication(), Market.valueOf(market), isGlobalService);
        }
        GuardianLivenessDetectionSDK.letSDKHandleCameraPermission();
    }

    @ReactMethod
    public void isDetectOcclusion(boolean isDetectOcclusion) {
        GuardianLivenessDetectionSDK.isDetectOcclusion(isDetectOcclusion);
    }

    @ReactMethod
    public void set3DLivenessTimeoutMills(int prepareTimeoutMills) {
        GuardianLivenessDetectionSDK.set3DLivenessTimeoutMills(prepareTimeoutMills);
    }

    @ReactMethod
    public void setLicenseAndCheck(String license, Callback successCallback, Callback errorCallback) {
        String checkResult = GuardianLivenessDetectionSDK.setLicenseAndCheck(license);
        if ("SUCCESS".equals(checkResult)) {
            successCallback.invoke(checkResult);
        } else {
            errorCallback.invoke(checkResult);
        }
    }

    @ReactMethod
    public void setActionSequence(boolean shuffle, ReadableArray detectionTypes) {
        Detector.DetectionType[] typeArray = new Detector.DetectionType[detectionTypes.size()];
        for (int i = 0; i < detectionTypes.size(); i++) {
            typeArray[i] = Detector.DetectionType.valueOf(detectionTypes.getString(i));
        }
        GuardianLivenessDetectionSDK.setActionSequence(shuffle, typeArray);
    }

    @ReactMethod
    public void setResultPictureSize(int pictureSize) {
        GuardianLivenessDetectionSDK.setResultPictureSize(pictureSize);
    }

    @ReactMethod
    public void setActionTimeoutMills(int actionTimeoutMills) {
        GuardianLivenessDetectionSDK.setActionTimeoutMills(actionTimeoutMills);
    }

    @ReactMethod
    public void setDetectionLevel(String detectionLevel) {
        GuardianLivenessDetectionSDK.setDetectionLevel(GuardianLivenessDetectionSDK.DetectionLevel.valueOf(detectionLevel));
    }

    @ReactMethod
    public void bindUser(String userId) {
        GuardianLivenessDetectionSDK.bindUser(userId);
    }

    @ReactMethod
    public void setSignatureId(String signatureId) {
        GuardianLivenessDetectionSDK.setSignatureId(signatureId);
    }
}
