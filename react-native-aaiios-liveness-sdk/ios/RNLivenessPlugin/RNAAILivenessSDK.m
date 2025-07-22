//
//  RNAAILivenessSDK.m
//  Pods
//
//  Created by aaaa zhao on 2020/10/28.
//

#import "RNAAILivenessSDK.h"
#import "RNAAILivenessSDKEvent.h"
@import AAILivenessSDK;

#import "AAILivenessViewController.h"
#import "AAILivenessFailedResult.h"

@interface AAICustomLivenessViewController: AAILivenessViewController
@property(nonatomic, copy) void (^closeBlk)(void);
@property(nonatomic) BOOL animated;
@end
@implementation AAICustomLivenessViewController

- (void)tapBackBtnAction
{
    [self.presentingViewController dismissViewControllerAnimated:self.animated completion:self.closeBlk];
}

@end

@interface  RNAAILivenessSDK()
{
    NSInteger _actionTimeout;
}
@property(nonatomic, copy, nullable) NSArray<NSNumber *> *detectionActions;
@property(nonatomic) BOOL animated;
@end
@implementation RNAAILivenessSDK

RCT_EXPORT_MODULE()

- (instancetype)init
{
    self = [super init];
    if (self) {
        _animated = YES;
        _actionTimeout = 10;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (dispatch_queue_t)methodQueue
{
   return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(initSDKByKey:(NSString *)accessKey secretKey:(NSString *)secretKey market:(NSString *)market isGlobalService:(BOOL)isGlobalService)
{
    AAILivenessMarket currMarket = [RNAAILivenessSDK marketWithStr: market];
    [AAILivenessSDK initWithAccessKey:accessKey secretKey: secretKey market: currMarket isGlobalService:isGlobalService];
}

RCT_EXPORT_METHOD(initSDKByLicense:(NSString *)market isGlobalService:(BOOL)isGlobalService)
{
    AAILivenessMarket currMarket = [RNAAILivenessSDK marketWithStr: market];
    [AAILivenessSDK initWithMarket: currMarket isGlobalService:isGlobalService];
}

RCT_EXPORT_METHOD(setLicenseAndCheck:(NSString *)license callback:(RCTResponseSenderBlock)callback)
{
    NSString *result = [AAILivenessSDK configLicenseAndCheck:license];
    callback(@[result]);
}

RCT_EXPORT_METHOD(setAuditImageConfig:(NSDictionary *)config)
{
    // 'config' contain follow keys:
    //   enableCollect
    //   captureInterval
    //   maxNumber
    //   imageWidth
    //   imageQuality

    // Check if 'config' is null or NSNull class
    if (config == nil || [config isKindOfClass:[NSNull class]]) {
        // Just disable collect audit images
        AAIAdditionalConfig *additionalConfig = [AAILivenessSDK additionalConfig];
        additionalConfig.enableCollectAuditImages = NO;
    } else if ([config isKindOfClass:[NSDictionary class]]){
        AAIAdditionalConfig *additionalConfig = [AAILivenessSDK additionalConfig];
        NSNumber *enableCollectObj = config[@"enableCollect"];
        if ([enableCollectObj isKindOfClass:[NSNumber class]]) {
            additionalConfig.enableCollectAuditImages = [enableCollectObj boolValue];
        }
        
        NSNumber *captureIntervalObj = config[@"captureInterval"];
        if ([captureIntervalObj isKindOfClass:[NSNumber class]]) {
            additionalConfig.auditImageCaptureInterval = [captureIntervalObj integerValue];
        }

        NSNumber *maxNumberObj = config[@"maxNumber"];
        if ([maxNumberObj isKindOfClass:[NSNumber class]]) {
            additionalConfig.auditImageMaxNumber = [maxNumberObj integerValue];
        }

        NSNumber *imageWidthObj = config[@"imageWidth"];
        if ([imageWidthObj isKindOfClass:[NSNumber class]]) {
            additionalConfig.auditImageWidth = [imageWidthObj floatValue];
        }

        NSNumber *imageQualityObj = config[@"imageQuality"];
        if ([imageQualityObj isKindOfClass:[NSNumber class]]) {
            additionalConfig.auditImageQuality = [imageQualityObj integerValue];
        }
    }
}

RCT_EXPORT_METHOD(setVideoRecorderConfig:(NSDictionary *)config)
{
    // 'config' contain follow keys:
    //   enableRecord
    //   maxDuration
   
    // Check if 'config' is null or NSNull class
    if (config == nil || [config isKindOfClass:[NSNull class]]) {
        // Just disable record video
        [AAILivenessSDK configVideo: NULL];
    } else if ([config isKindOfClass:[NSDictionary class]]) {
        NSNumber *enableRecordObj = config[@"enableRecord"];
        if ([enableRecordObj isKindOfClass:[NSNumber class]]) {
            BOOL enableRecord = [enableRecordObj boolValue];
            if (enableRecord) {
                AAIVideoConfig *vConfig = [AAIVideoConfig defaultConfig];
                NSNumber *maxDurationObj = config[@"maxDuration"];
                if ([maxDurationObj isKindOfClass:[NSNumber class]]) {
                    vConfig.maxRecordDuration = [maxDurationObj integerValue];
                }
                [AAILivenessSDK configVideo:vConfig];
            } else {
                [AAILivenessSDK configVideo: NULL];
            }
        }
        
    }
}


RCT_EXPORT_METHOD(startLiveness:(NSDictionary *)config)
{
    AAIAdditionalConfig *additionalConfig = [AAILivenessSDK additionalConfig];
    additionalConfig.pluginType = AAILDPluginTypeReactNative;
    AAICustomLivenessViewController *vc = [[AAICustomLivenessViewController alloc] init];
    vc.actionTimeoutInterval = _actionTimeout;
    
    if (_detectionActions) {
        vc.detectionActions = _detectionActions;
    }

    NSNumber *showHUDObj = config[@"showHUD"];
    if ([showHUDObj isKindOfClass:[NSNumber class]]) {
        vc.showHUD = [showHUDObj boolValue];
    }

    BOOL animated = YES;
    NSNumber *animatedObj = config[@"animated"];
    if ([animatedObj isKindOfClass:[NSNumber class]]) {
        animated = [animatedObj boolValue];
        self.animated = animated;
    }
    vc.animated = self.animated;

    BOOL playPromptAudio = YES;
    NSNumber *playPromptAudioObj = config[@"playPromptAudio"];
    if ([playPromptAudioObj isKindOfClass:[NSNumber class]]) {
        vc.playAudio = [playPromptAudioObj boolValue];
    }

    BOOL showAnimationImgs = YES;
    NSNumber *showAnimationImgsObj = config[@"showAnimationImgs"];
    if ([showAnimationImgsObj isKindOfClass:[NSNumber class]]) {
        vc.showAnimationImg = [showAnimationImgsObj boolValue];
    }

    NSString *lanObj = config[@"language"];
    if ([lanObj isKindOfClass:[NSString class]]) {
        vc.language = lanObj;
    }
    
    NSNumber *prepareTimeoutObj = config[@"prepareTimeoutInterval"];
    if ([prepareTimeoutObj isKindOfClass:[NSNumber class]]) {
        NSInteger prepareTimeoutInterval = [prepareTimeoutObj integerValue];
        if (prepareTimeoutInterval > 0) {
            vc.prepareTimeoutInterval = prepareTimeoutInterval;
        }
    }
    
    NSNumber *actionTimeoutObj = config[@"actionTimeoutInterval"];
    if ([actionTimeoutObj isKindOfClass:[NSNumber class]]) {
        NSInteger actionTimeoutInterval = [actionTimeoutObj integerValue];
        if (actionTimeoutInterval > 0) {
            vc.actionTimeoutInterval = actionTimeoutInterval;
        }
    }

    NSNumber *timeoutObj = config[@"timeoutDurationOf3DMode"];
    if ([timeoutObj isKindOfClass:[NSNumber class]]) {
        NSInteger timeout = [timeoutObj integerValue];
        if (timeout > 0) {
            vc.timeoutDurationOf3DMode = timeout;
        }
    }

    NSString *roundBorderColorObj = config[@"roundBorderColor"];
    if ([roundBorderColorObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: roundBorderColorObj];
        if (tmpColor) {
            AAIAdditionalConfig *config = [AAILivenessSDK additionalConfig];
            config.roundBorderColor = tmpColor;
        }
    }

    NSString *ellipseLineColorObj = config[@"ellipseLineColor"];
    if ([ellipseLineColorObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: ellipseLineColorObj];
        if (tmpColor) {
            AAIAdditionalConfig *config = [AAILivenessSDK additionalConfig];
            config.ellipseLineColor = tmpColor;
        }
    }

    NSString *ellipseBorderCol3DObj = config[@"ellipseBorderCol3D"];
    if ([ellipseBorderCol3DObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: ellipseBorderCol3DObj];
        if (tmpColor) {
            AAIAdditionalConfig *config = [AAILivenessSDK additionalConfig];
            config.ellipseBorderCol3D = tmpColor;
        }
    }

    NSString *normalEllipseBorderCol3DObj = config[@"normalEllipseBorderCol3D"];
    if ([normalEllipseBorderCol3DObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: normalEllipseBorderCol3DObj];
        if (tmpColor) {
            AAIAdditionalConfig *config = [AAILivenessSDK additionalConfig];
            config.normalEllipseBorderCol3D = tmpColor;
        }
    }

    NSString *innerEllipseLineCol3DObj = config[@"innerEllipseLineCol3D"];
    if ([innerEllipseLineCol3DObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: innerEllipseLineCol3DObj];
        if (tmpColor) {
            AAIAdditionalConfig *config = [AAILivenessSDK additionalConfig];
            config.innerEllipseLineCol3D = tmpColor;
        }
    }

    NSString *hudBrandColorObj = config[@"hudBrandColor"];
    if ([hudBrandColorObj isKindOfClass:[NSString class]]) {
        UIColor *tmpColor = [self colorWithHexRGBStr: hudBrandColorObj];
        if (tmpColor) {
            vc.hudBrandColor = tmpColor;
        }
    }

    NSNumber *recordUserGiveUpObj = config[@"recordUserGiveUp"];
    if ([recordUserGiveUpObj isKindOfClass:[NSNumber class]]) {
        BOOL recordUserGiveUp = [recordUserGiveUpObj boolValue];
        vc.recordUserGiveUp = recordUserGiveUp;
    }

    NSString *signatureIdObj = config[@"signatureId"];
    if ([signatureIdObj isKindOfClass:[NSString class]]) {
        additionalConfig.signatureId = signatureIdObj;
    } else {
        additionalConfig.signatureId = nil;
    }

    vc.cameraPermissionDeniedBlk = ^(AAILivenessViewController *rawVC) {
        // detection failed callback
        NSString *state = [AAILivenessUtil localStrForKey:@"no_camera_permission" lprojName:rawVC.language];
        NSDictionary *errorInfo = @{@"key": @"no_camera_permission", @"message": state, @"authed": @(NO)};
        
        [rawVC.presentingViewController dismissViewControllerAnimated:self.animated completion:^{
            [RNAAILivenessSDKEvent postNotiToReactNative:@"onCameraPermission" body:errorInfo];
        }];
    };

    vc.beginRequestBlk = ^(AAILivenessViewController *rawVC) {
        // begin request callback
        [RNAAILivenessSDKEvent postNotiToReactNative:@"livenessViewBeginRequest" body:@{}];
    };

    vc.endRequestBlk = ^(AAILivenessViewController *rawVC, NSDictionary *error) {

        // end request callback
        NSDictionary *errorInfo = nil;
        if (error && error.count > 0) {
            AAILivenessFailedResult *failedResult = [AAILivenessFailedResult resultWithErrorInfo:error];
            errorInfo = @{@"message": failedResult.errorMsg, @"code": failedResult.errorCode, @"transactionId": failedResult.transactionId};
        } else {
            errorInfo = @{};
        }

        [RNAAILivenessSDKEvent postNotiToReactNative:@"livenessViewEndRequest" body:@{}];
    };

    vc.detectionReadyBlk = ^(AAILivenessViewController *rawVC, AAIDetectionType detectionType, NSDictionary *info) {
        NSDictionary *dict = @{@"key": info[@"key"], @"message": info[@"state"]};
        [RNAAILivenessSDKEvent postNotiToReactNative:@"onDetectionReady" body:dict];
    };

    vc.detectionFailedBlk = ^(AAILivenessViewController *rawVC, NSDictionary *errorInfo) {
        // detection failed callback
       AAILivenessFailedResult *result = [AAILivenessFailedResult resultWithErrorInfo:errorInfo];
        NSDictionary *additionalInfo = @{
            @"transactionId": result.transactionId,
            @"rawErrorCode": result.rawErrorCode,
            @"eventId": result.eventId
            };
        NSDictionary *dict = @{@"key": result.errorCode, @"message": result.errorMsg, @"additionalInfo": additionalInfo};
        [rawVC.presentingViewController dismissViewControllerAnimated:self.animated completion:^{
            [RNAAILivenessSDKEvent postNotiToReactNative:@"onDetectionFailed" body:dict];
        }];
    };

    vc.detectionTypeChangedBlk = ^(AAILivenessViewController *rawVC, AAIDetectionType toDetectionType, NSDictionary *info) {
        // detection type changed callback
        NSDictionary *bodyInfo = @{@"key": info[@"key"], @"state": info[@"state"]};
        [RNAAILivenessSDKEvent postNotiToReactNative:@"onDetectionTypeChanged" body:bodyInfo];
    };

    vc.detectionSuccessBlk = ^(AAILivenessViewController *rawVC, AAILivenessResult *result) {
        NSString *base64ImgStr = [result getImgBase64Str];
        if (base64ImgStr == nil) {
            base64ImgStr = @"";
        }
        
        NSDictionary *successInfo = @{
                @"livenessId": result.livenessId,
                @"img": base64ImgStr,
                @"transactionId": (result.transactionId == nil ? @"" : result.transactionId),
                @"eventId": result.eventId
            };
        NSMutableDictionary *body = [[NSMutableDictionary alloc] initWithDictionary:successInfo];
        
        // Get video result
        AAIVideoConfig *originVConfig = [AAILivenessSDK videoConfig];
        if (originVConfig != nil && originVConfig.recordStage != AAIVideoRecordStageUnspecified) {
           NSString *videoFilePath = @"";
           AAIVideoRecordResult *videoResult = [AAILivenessSDK syncGetLatestVideoRecordResult];
           if (videoResult != nil && videoResult.code != AAIVideoRecordResultCodeFailed) {
               videoFilePath = videoResult.videoPath;
           }
           body[@"videoFilePath"] = videoFilePath;
        }
        
        [rawVC.presentingViewController dismissViewControllerAnimated:self.animated completion:^{
            [RNAAILivenessSDKEvent postNotiToReactNative:@"onDetectionComplete" body:body];
        }];
    };

    UINavigationController *navc = [[UINavigationController alloc] initWithRootViewController:vc];
    navc.navigationBarHidden = YES;
    navc.modalPresentationStyle = UIModalPresentationFullScreen;
    
    UIViewController *rootVC = [UIApplication sharedApplication].delegate.window.rootViewController;
    [rootVC presentViewController:navc animated:animated completion:nil];
}

RCT_EXPORT_METHOD(setDetectOcclusion:(BOOL)detectOcc)
{
    [AAILivenessSDK configDetectOcclusion:detectOcc];
}

RCT_EXPORT_METHOD(setResultPictureSize:(CGFloat)size)
{
    [AAILivenessSDK configResultPictureSize:size];
}

RCT_EXPORT_METHOD(setActionTimeoutSeconds:(NSInteger)actionTimeout)
{
    _actionTimeout = actionTimeout;
}

RCT_EXPORT_METHOD(setActionSequence:(BOOL)shuffle actionSequence:(NSArray *)actionSequence)
{
    if (actionSequence == nil) {
        return;
    }
    
    NSMutableArray<NSNumber *> *actionTypeList = [[NSMutableArray alloc] init];
    for (NSString *actionStr in actionSequence) {
        NSInteger actionType = [self actionOfValue:actionStr];
        if (actionType < 0) {
            NSLog(@"Action %@ is not support", actionStr);
            return;
        } else {
            [actionTypeList addObject:@(actionType)];
        }
    }
    
    if (actionTypeList.count == 0) {
        return;
    }
    // Random index array
    if (shuffle) {
        NSUInteger idx = actionTypeList.count - 1;
        while (idx) {
            [actionTypeList exchangeObjectAtIndex:idx withObjectAtIndex:arc4random_uniform((uint32_t)idx)];
            idx--;
        }
    }
    
    self.detectionActions = [actionTypeList copy];
}

RCT_EXPORT_METHOD(setDetectionLevel:(NSString *)level)
{
    AAIDetectionLevel detectionLevel = AAIDetectionLevelNormal;
    NSString *lowerStr = [level lowercaseString];

    if ([lowerStr isEqualToString:@"easy"]) {
        detectionLevel = AAIDetectionLevelEasy;
    } else if ([lowerStr isEqualToString:@"normal"]) {
        detectionLevel = AAIDetectionLevelNormal;
    } else if ([lowerStr isEqualToString:@"hard"]) {
        detectionLevel = AAIDetectionLevelHard;
    }
    AAIAdditionalConfig *additionalConfig = [AAILivenessSDK additionalConfig];
    additionalConfig.detectionLevel = detectionLevel;
}

RCT_EXPORT_METHOD(bindUserId:(NSString *)userId)
{
    [AAILivenessSDK configUserId:userId];
}

RCT_EXPORT_METHOD(sdkVersion:(RCTResponseSenderBlock)callback)
{
    NSString *version = [AAILivenessSDK sdkVersion];
    callback(@[version]);
}

+ (AAILivenessMarket)marketWithStr:(NSString *)marketStr
{
    NSDictionary *map = @{
        @"AAILivenessMarketIndonesia": @(AAILivenessMarketIndonesia),
        @"AAILivenessMarketIndia": @(AAILivenessMarketIndia),
        @"AAILivenessMarketPhilippines": @(AAILivenessMarketPhilippines),
        @"AAILivenessMarketVietnam": @(AAILivenessMarketVietnam),
        @"AAILivenessMarketThailand": @(AAILivenessMarketThailand),
        @"AAILivenessMarketMexico": @(AAILivenessMarketMexico),
        @"AAILivenessMarketMalaysia": @(AAILivenessMarketMalaysia),
        @"AAILivenessMarketPakistan": @(AAILivenessMarketPakistan),
        @"AAILivenessMarketNigeria": @(AAILivenessMarketNigeria),
        @"AAILivenessMarketColombia": @(AAILivenessMarketColombia),
        @"AAILivenessMarketSingapore":@(AAILivenessMarketSingapore),
        @"AAILivenessMarketBPS": @(AAILivenessMarketBPS),
    };
    return (AAILivenessMarket)([map[marketStr] integerValue]);
}

- (NSInteger)actionOfValue:(NSString *)actionStr {
    NSInteger actionType = -1;
    if ([actionStr.lowercaseString isEqualToString:@"mouth"]) {
        actionType = AAIDetectionTypeMouth;
    } else if ([actionStr.lowercaseString isEqualToString:@"blink"]) {
        actionType = AAIDetectionTypeBlink;
    } else if ([actionStr.lowercaseString isEqualToString:@"pos_yaw"]) {
        actionType = AAIDetectionTypePosYaw;
    }
    
    return actionType;
}

- (UIColor *)colorWithHexRGBStr:(NSString *)hexRGBStr
{
    if (hexRGBStr == nil) {
        return nil;
    }

    if (hexRGBStr.length != 7 && hexRGBStr.length != 9) {
        NSLog(@"Unsupport hexRGBStr: %@", hexRGBStr);
        return nil;
    }

    // #RRGGBB
    if (hexRGBStr.length == 7) {
        NSString *tmpStr = [hexRGBStr substringFromIndex:1];
        long rgbValue = strtol(tmpStr.UTF8String, NULL, 16);
        CGFloat r = ((rgbValue & 0xFF0000) >> 16)/255.0;
        CGFloat g = ((rgbValue & 0xFF00) >> 8)/255.0;
        CGFloat b = (rgbValue & 0xFF)/255.0;
        return [UIColor colorWithRed:r green:g blue:b alpha:1];
    }
    
    // #RRGGBBAA
    if (hexRGBStr.length == 9) {
        NSString *tmpStr = [hexRGBStr substringFromIndex:1];
        long rgbaValue = strtol(tmpStr.UTF8String, NULL, 16);
        CGFloat r = ((rgbaValue & 0xFF000000) >> 24)/255.0;
        CGFloat g = ((rgbaValue & 0xFF0000) >> 16)/255.0;
        CGFloat b = ((rgbaValue & 0xFF00) >> 8)/255.0;
        CGFloat a = (rgbaValue & 0xFF)/255.0;
        return [UIColor colorWithRed:r green:g blue:b alpha:a];
    }
    
    return nil;
}

@end
