#import "DaneshMateBridge.h"

@implementation DaneshMateBridge

RCT_EXPORT_MODULE(DaneshMateCore);

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

RCT_EXPORT_METHOD(initCore:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        daneshmate_init_core();
        resolve(@(YES));
    } @catch (NSException *exception) {
        reject(@"E_INIT_FAILED", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(syncData:(NSString *)payloadJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    // Run on default background queue to prevent blocking the main UI thread
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @try {
            const char *c_payload = payloadJson ? [payloadJson UTF8String] : NULL;
            char *c_result = daneshmate_sync_data(c_payload);

            if (c_result == NULL) {
                dispatch_async(dispatch_get_main_queue(), ^{
                    reject(@"E_SYNC_NULL", @"Rust FFI returned null pointer", nil);
                });
                return;
            }

            NSString *resultString = [NSString stringWithUTF8String:c_result];
            daneshmate_free_string(c_result);

            dispatch_async(dispatch_get_main_queue(), ^{
                resolve(resultString);
            });
        } @catch (NSException *exception) {
            dispatch_async(dispatch_get_main_queue(), ^{
                reject(@"E_SYNC_FAILED", exception.reason, nil);
            });
        }
    });
}

@end
