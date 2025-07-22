import React, { Component } from 'react';
import { StyleSheet, requireNativeComponent, NativeModules, NativeEventEmitter, UIManager, findNodeHandle} from 'react-native';


export default class AAIIOSLivenessSDK {

  static initSDKByLicense(market, isGlobalService) {
    NativeModules.RNAAILivenessSDK.initSDKByLicense(market, isGlobalService)
  }

  static initSDKByKey(accessKey, secretKey, market, isGlobalService) {
    NativeModules.RNAAILivenessSDK.initSDKByKey(accessKey, secretKey, market, isGlobalService)
  }

  static setDetectOcclusion(detectOcclusion) {
    NativeModules.RNAAILivenessSDK.setDetectOcclusion(detectOcclusion)
  }

  static setResultPictureSize(pictureSize) {
    NativeModules.RNAAILivenessSDK.setResultPictureSize(pictureSize)
  }

  static setActionTimeoutSeconds(actionTimeout) {
    NativeModules.RNAAILivenessSDK.setActionTimeoutSeconds(actionTimeout)
  }

  static setActionSequence(shuffle, actionSequence) {
    NativeModules.RNAAILivenessSDK.setActionSequence(shuffle, actionSequence)
  }

  static setDetectionLevel(level) {
    NativeModules.RNAAILivenessSDK.setDetectionLevel(level)
  }

  static setAuditImageConfig(enableCollect, captureInterval, maxNumber, imageWidth, imageQuality) {
    const config = {
      enableCollect: enableCollect || false,
      captureInterval: captureInterval || 400,
      maxNumber: maxNumber || 10,
      imageWidth: imageWidth || 400,
      imageQuality: imageQuality || 30
    }
    NativeModules.RNAAILivenessSDK.setAuditImageConfig(config)
  }

  static setVideoRecorderConfig(enableRecord, maxDuration) {
    const config = {
      enableRecord: enableRecord || false,
      maxDuration: maxDuration || 60
    }
    NativeModules.RNAAILivenessSDK.setVideoRecorderConfig(config)
  }

  static bindUser(userId) {
    NativeModules.RNAAILivenessSDK.bindUser(userId)
  }

  static setLicenseAndCheck(license, callback) {
    NativeModules.RNAAILivenessSDK.setLicenseAndCheck(license, callback)
  }

  static _sdkEventListener = null
  static _callback = {}

  // Callback
  static _sdkEventCallback = {
    onCameraPermission: (errorInfo) => {
      if (errorInfo && !errorInfo.authed) {
        // Permission denied
        // {"key": "xxx", "message": "xxx"}
        if (this._callback.onCameraPermissionDenied) {
            this._callback.onCameraPermissionDenied(errorInfo.key, errorInfo.message)
        }            
      }

      if (this._sdkEventListener) {
        this._sdkEventListener.remove()
      }
    },
    onDetectionReady: (info) => {
      // {"key": "xxx", "message": "xxx", "state": "xxx"}
      //  console.log('onDetectionReady: ', info)
    },
    onFrameDetected: (info) => {
      // {"key": "xxx", "state": "xxx"}
      // console.log('onFrameDetected: ', info)
    },
    onDetectionTypeChanged: (info) => {
      // {"key": "xxx", "state": "xxx"}
      // console.log('onDetectionTypeChanged: ', info)
    },
    onDetectionComplete: (info) => {
      // {"livenessId": "xxx", "img": "xxx", "transactionId": "xxx"}
      if (typeof(this._callback.onDetectionComplete) === "function") {
        // Remove field "livenessId" and "img" from info
        // then save result to addtionalInfo
        var additionalInfo = Object.assign({}, info);
        delete additionalInfo.livenessId
        delete additionalInfo.img

        this._callback.onDetectionComplete(info.livenessId, info.img, additionalInfo)
      }

      if (this._sdkEventListener) {
        this._sdkEventListener.remove()
      }
    },
    onDetectionFailed: (errorInfo) => {
        // Show alert view
        // {"key": "xxx", "message": "xxx", "state": "xxx"}
        if (typeof(this._callback.onDetectionFailed) === "function") {
          this._callback.onDetectionFailed(errorInfo.key, errorInfo.message, errorInfo.additionalInfo)
        }

        if (this._sdkEventListener) {
          this._sdkEventListener.remove()
        }
      },
    livenessViewBeginRequest: (info) => {
      // Show loading view
      if (typeof(this._callback.livenessViewBeginRequest) === "function") {
        this._callback.livenessViewBeginRequest()
      }
    },

    livenessViewEndRequest: (errorInfo) => {
      // Close loading view
      // {}
      if (typeof(this._callback.livenessViewEndRequest) === "function") {
        this._callback.livenessViewEndRequest()
      }
    },
  }

  static startLiveness(config, callback) {
    this._callback = callback

    const sdkEmitter = new NativeEventEmitter(NativeModules.RNAAILivenessSDKEvent);
    this._sdkEventListener = sdkEmitter.addListener('RNAAILivenessSDKEvent', (info) => {
      this._sdkEventCallback[info.name](info.body)
    });
    
    NativeModules.RNAAILivenessSDK.startLiveness(config)
  }

  static sdkVersion(callback) {
    NativeModules.RNAAILivenessSDK.sdkVersion(callback)
  }
}
