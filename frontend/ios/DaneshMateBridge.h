#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#ifdef __cplusplus
extern "C" {
#endif

// Prototypes for embedded Rust C-ABI functions
void daneshmate_init_core(void);
char* daneshmate_sync_data(const char* payload_json);
void daneshmate_free_string(char* ptr);

#ifdef __cplusplus
}
#endif

@interface DaneshMateBridge : NSObject <RCTBridgeModule>
@end
