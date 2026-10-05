package com.daneshmate.app;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

import ir.myket.billingclient.IabHelper;
import ir.myket.billingclient.util.IabResult;
import ir.myket.billingclient.util.Inventory;
import ir.myket.billingclient.util.Purchase;
import ir.myket.billingclient.util.SkuDetails;

/**
 * Native Capacitor Plugin bridging DaneshMate with official Myket Billing Client 1.19.
 * Handles strictly consumable voluntary developer-support purchases (support_coffee, support_treat, support_code).
 * No subscriptions, no feature locks, no hardcoded local prices.
 */
@CapacitorPlugin(name = "MyketBilling")
public class MyketBillingPlugin extends Plugin {

    private static final String TAG = "MyketBillingPlugin";
    public static final String MYKET_PACKAGE_NAME = "ir.mservices.market";

    // SharedPreferences for persistent pending purchase payloads
    private static final String PREFS_NAME = "daneshmate_myket_billing_prefs";
    private static final String PREF_PENDING_PAYLOAD_PREFIX = "pending_payload_";

    // Allowed consumable voluntary support SKUs (Neutral semantic IDs)
    public static final String SKU_SUPPORT_COFFEE = "support_coffee";
    public static final String SKU_SUPPORT_TREAT = "support_treat";
    public static final String SKU_SUPPORT_CODE = "support_code";

    public static final Set<String> ALLOWED_SKUS = Collections.unmodifiableSet(
        new HashSet<>(Arrays.asList(SKU_SUPPORT_COFFEE, SKU_SUPPORT_TREAT, SKU_SUPPORT_CODE))
    );

    private IabHelper mHelper;
    private final AtomicBoolean mIsSetupDone = new AtomicBoolean(false);
    private final AtomicBoolean mIsSettingUp = new AtomicBoolean(false);
    private final AtomicBoolean mPurchaseInProgress = new AtomicBoolean(false);

    // Active purchase call and tracking
    private PluginCall mActivePurchaseCall;
    private String mPendingExpectedPayload;
    private String mPendingSku;

    @Override
    protected void handleOnDestroy() {
        cleanupActivePurchase(null, "PLUGIN_DESTROYED", "پلاگین بسته شد.");
        disposeInternal();
        super.handleOnDestroy();
    }

    private synchronized void disposeInternal() {
        mIsSetupDone.set(false);
        mIsSettingUp.set(false);
        mPurchaseInProgress.set(false);
        if (mHelper != null) {
            try {
                mHelper.dispose();
            } catch (Exception e) {
                Log.w(TAG, "Exception during IabHelper dispose: " + e.getMessage());
            }
            mHelper = null;
        }
    }

    private SharedPreferences getBillingPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private void persistPendingPayload(String sku, String payload) {
        if (sku == null) return;
        getBillingPrefs().edit().putString(PREF_PENDING_PAYLOAD_PREFIX + sku, payload).apply();
    }

    private String getPersistedPendingPayload(String sku) {
        if (sku == null) return null;
        return getBillingPrefs().getString(PREF_PENDING_PAYLOAD_PREFIX + sku, null);
    }

    private void clearPersistedPendingPayload(String sku) {
        if (sku == null) return;
        getBillingPrefs().edit().remove(PREF_PENDING_PAYLOAD_PREFIX + sku).apply();
    }

    private boolean isPackageInstalled(String packageName) {
        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    /**
     * Check if Myket application is installed and billing plugin is ready.
     */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        boolean isMyketInstalled = isPackageInstalled(MYKET_PACKAGE_NAME);
        JSObject ret = new JSObject();
        ret.put("available", isMyketInstalled);
        ret.put("isMyketInstalled", isMyketInstalled);
        ret.put("isSetupDone", mIsSetupDone.get() && mHelper != null);
        ret.put("distributionChannel", BuildConfig.DISTRIBUTION_CHANNEL);
        call.resolve(ret);
    }

    /**
     * Get the compile-time distribution channel (myket or github).
     */
    @PluginMethod
    public void getDistributionChannel(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("channel", BuildConfig.DISTRIBUTION_CHANNEL);
        call.resolve(ret);
    }

    /**
     * Explicit dispose method for lifecycle management.
     */
    @PluginMethod
    public void dispose(PluginCall call) {
        disposeInternal();
        JSObject ret = new JSObject();
        ret.put("disposed", true);
        call.resolve(ret);
    }

    /**
     * Initialize the official Myket Billing Client (1.19).
     * Sourced from BuildConfig.MYKET_PUBLIC_KEY, fails gracefully if empty, never logged or exposed to JS.
     */
    @PluginMethod
    public void init(final PluginCall call) {
        if (!isPackageInstalled(MYKET_PACKAGE_NAME)) {
            JSObject errObj = new JSObject();
            errObj.put("initialized", false);
            errObj.put("isMyketInstalled", false);
            call.reject("برنامه مایکت روی دستگاه شما یافت نشد. لطفاً جهت پرداخت ابتدا مایکت را نصب فرمایید.", "MYKET_NOT_INSTALLED", errObj);
            return;
        }

        if (mIsSetupDone.get() && mHelper != null) {
            JSObject res = new JSObject();
            res.put("initialized", true);
            res.put("isMyketInstalled", true);
            res.put("message", "سرویس خرید مایکت پیش‌تر راه‌اندازی شده و آماده است.");
            call.resolve(res);
            return;
        }

        if (mIsSettingUp.compareAndSet(false, true)) {
            disposeInternal();
            mIsSettingUp.set(true);

            try {
                // Key sourced securely from BuildConfig without logging or UI exposure
                String rsaPublicKey = BuildConfig.MYKET_PUBLIC_KEY;
                if (rsaPublicKey == null) {
                    rsaPublicKey = "";
                }

                mHelper = new IabHelper(getContext(), rsaPublicKey.trim());
                mHelper.enableDebugLogging(false, TAG);

                mHelper.startSetup(new IabHelper.OnIabSetupFinishedListener() {
                    @Override
                    public void onIabSetupFinished(IabResult result) {
                        mIsSettingUp.set(false);

                        if (result == null) {
                            mIsSetupDone.set(false);
                            call.reject("خطا در برقراری ارتباط با مایکت (پاسخ خالی)", "SETUP_NULL_RESULT");
                            return;
                        }

                        if (result.isSuccess()) {
                            mIsSetupDone.set(true);
                            Log.i(TAG, "Official Myket billing client setup completed successfully.");

                            // Recover & consume any unconsumed support purchases immediately
                            recoverAndConsumePendingPurchases(null);

                            JSObject res = new JSObject();
                            res.put("initialized", true);
                            res.put("isMyketInstalled", true);
                            res.put("message", "سرویس خرید مایکت با موفقیت راه‌اندازی شد.");
                            call.resolve(res);
                        } else {
                            mIsSetupDone.set(false);
                            int responseCode = result.getResponse();
                            String errorMsg = result.getMessage();
                            Log.e(TAG, "Myket billing setup failed: " + errorMsg + " (Code: " + responseCode + ")");
                            call.reject("راه‌اندازی سرویس پرداخت مایکت ناموفق بود: " + errorMsg, String.valueOf(responseCode));
                        }
                    }
                });
            } catch (Exception e) {
                mIsSettingUp.set(false);
                mIsSetupDone.set(false);
                Log.e(TAG, "Exception during Myket billing init", e);
                call.reject("خطا در راه‌اندازی سرویس مایکت: " + e.getMessage(), "INIT_EXCEPTION");
            }
        } else {
            // Already setting up
            call.reject("راه‌اندازی سرویس مایکت هم‌اکنون در جریان است.", "INIT_IN_PROGRESS");
        }
    }

    /**
     * Query authoritative product SKU details and prices directly from Myket.
     * No fallback/fabricated prices are generated.
     */
    @PluginMethod
    public void queryProducts(final PluginCall call) {
        if (mHelper == null || !mIsSetupDone.get()) {
            call.reject("سرویس خرید مایکت هنوز راه‌اندازی نشده است.", "BILLING_NOT_INITIALIZED");
            return;
        }

        final List<String> skuList = new ArrayList<>();
        JSArray skusArg = call.getArray("skus");
        if (skusArg != null && skusArg.length() > 0) {
            for (int i = 0; i < skusArg.length(); i++) {
                try {
                    String s = skusArg.getString(i);
                    if (s != null && !s.trim().isEmpty()) {
                        skuList.add(s.trim());
                    }
                } catch (JSONException ignored) {}
            }
        }
        if (skuList.isEmpty()) {
            skuList.addAll(ALLOWED_SKUS);
        }

        try {
            mHelper.queryInventoryAsync(true, skuList, new IabHelper.QueryInventoryFinishedListener() {
                @Override
                public void onQueryInventoryFinished(IabResult result, Inventory inv) {
                    if (result == null || result.isFailure() || inv == null) {
                        String errMsg = result != null ? result.getMessage() : "Unknown inventory error";
                        call.reject("خطا در دریافت مشخصات و قیمت محصولات از مایکت: " + errMsg, "QUERY_FAILED");
                        return;
                    }

                    JSArray productsArray = new JSArray();
                    for (String sku : skuList) {
                        SkuDetails details = inv.getSkuDetails(sku);
                        if (details != null) {
                            JSObject pObj = new JSObject();
                            pObj.put("sku", details.getSku());
                            pObj.put("title", details.getTitle());
                            pObj.put("price", details.getPrice()); // Authoritative price from Myket
                            pObj.put("description", details.getDescription());
                            pObj.put("type", details.getType());
                            productsArray.put(pObj);
                        }
                    }

                    if (productsArray.length() == 0) {
                        call.reject("هیچ محصولی با شناسه‌های مشخص‌شده در مایکت یافت نشد.", "NO_PRODUCTS_FOUND");
                        return;
                    }

                    JSObject res = new JSObject();
                    res.put("products", productsArray);
                    call.resolve(res);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error querying products inventory from Myket", e);
            call.reject("خطا در استعلام قیمت محصولات از مایکت: " + e.getMessage(), "QUERY_EXCEPTION");
        }
    }

    /**
     * Launch purchase flow for a support tier with strict 10-step security validation:
     * 1. Validate SKU against allowlist.
     * 2. Generate unique developer payload nonce.
     * 3. Persist pending payload in SharedPreferences BEFORE launching flow.
     * 4. Launch purchase flow on Activity UI thread.
     * 5. Verify successful IabResult.
     * 6. Verify purchase object is not null.
     * 7. Verify allowed SKU.
     * 8. Verify developer payload matches persisted payload.
     * 9. Call consumeAsync immediately (consumable product).
     * 10. Report SUCCESS only after consume succeeds and clear pending state.
     */
    @PluginMethod
    public void purchase(final PluginCall call) {
        // Step 1: Validate SKU against allowlist
        final String sku = call.getString("sku");
        if (sku == null || sku.trim().isEmpty()) {
            call.reject("شناسه محصول الزامی است.", "INVALID_SKU");
            return;
        }
        final String cleanSku = sku.trim();

        if (!ALLOWED_SKUS.contains(cleanSku)) {
            call.reject("شناسه محصول در فهرست حمایت‌های معتبر نیست: " + cleanSku, "UNAUTHORIZED_SKU");
            return;
        }

        if (mHelper == null || !mIsSetupDone.get()) {
            call.reject("سرویس پرداخت مایکت آماده نیست. لطفاً مجدداً تلاش کنید.", "BILLING_NOT_INITIALIZED");
            return;
        }

        // Concurrency protection: prevent overlapping purchases
        if (!mPurchaseInProgress.compareAndSet(false, true)) {
            call.reject("یک تراکنش خرید در حال انجام است. لطفاً منتظر بمانید.", "PURCHASE_IN_PROGRESS");
            return;
        }

        // Step 2: Generate unique payload token
        final String developerPayload = call.getString(
            "developerPayload",
            "dm_p_" + cleanSku + "_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8)
        );

        // Step 3: Persist pending payload BEFORE launching purchase
        persistPendingPayload(cleanSku, developerPayload);

        mActivePurchaseCall = call;
        mPendingExpectedPayload = developerPayload;
        mPendingSku = cleanSku;

        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            cleanupActivePurchase(call, "ACTIVITY_UNAVAILABLE", "اکتیویتی برنامه در دسترس نیست.");
            return;
        }

        // Step 4: Launch purchase on Activity UI thread
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    mHelper.launchPurchaseFlow(
                        getActivity(),
                        cleanSku,
                        new IabHelper.OnIabPurchaseFinishedListener() {
                            @Override
                            public void onIabPurchaseFinished(IabResult result, Purchase purchase) {
                                handlePurchaseResult(result, purchase);
                            }
                        },
                        developerPayload
                    );
                } catch (Exception e) {
                    Log.e(TAG, "Failed to launch purchase flow", e);
                    cleanupActivePurchase(call, "LAUNCH_ERROR", "خطا در اجرای فرآیند خرید: " + e.getMessage());
                }
            }
        });
    }

    private synchronized void cleanupActivePurchase(PluginCall callToReject, String errCode, String errMsg) {
        mPurchaseInProgress.set(false);
        mPendingExpectedPayload = null;
        mPendingSku = null;
        if (callToReject != null) {
            callToReject.reject(errMsg, errCode);
        }
        mActivePurchaseCall = null;
    }

    private void handlePurchaseResult(IabResult result, Purchase purchase) {
        PluginCall call = mActivePurchaseCall;
        String expectedPayload = mPendingExpectedPayload;
        String expectedSku = mPendingSku;

        if (call == null) {
            mPurchaseInProgress.set(false);
            Log.w(TAG, "handlePurchaseResult invoked without an active purchase call.");
            return;
        }

        // Step 5 & 6: Verify successful result and non-null purchase
        if (result == null || result.isFailure() || purchase == null) {
            mPurchaseInProgress.set(false);
            if (result != null && result.getResponse() == IabHelper.BILLING_RESPONSE_RESULT_USER_CANCELED) {
                clearPersistedPendingPayload(expectedSku);
                cleanupActivePurchase(call, "USER_CANCELED", "خرید توسط کاربر لغو شد.");
                return;
            }
            if (result != null && result.getResponse() == IabHelper.BILLING_RESPONSE_RESULT_ITEM_ALREADY_OWNED) {
                Log.i(TAG, "Item already owned. Initiating recovery consumption.");
                recoverAndConsumeOwnedItem(expectedSku, call);
                return;
            }
            String err = result != null ? result.getMessage() : "اطلاعات خرید دریافت نشد.";
            int code = result != null ? result.getResponse() : -1;
            cleanupActivePurchase(call, String.valueOf(code), "پرداخت انجام نشد: " + err);
            return;
        }

        // Step 7: Verify allowed SKU
        if (!ALLOWED_SKUS.contains(purchase.getSku())) {
            clearPersistedPendingPayload(purchase.getSku());
            cleanupActivePurchase(call, "INVALID_PURCHASED_SKU", "شناسه محصول خریداری‌شده غیرمجاز است: " + purchase.getSku());
            return;
        }

        // Step 8: Verify developer payload matches persisted pending token
        String persistedPayload = getPersistedPendingPayload(purchase.getSku());
        String checkPayload = expectedPayload != null ? expectedPayload : persistedPayload;

        if (checkPayload != null && !checkPayload.isEmpty()) {
            String actualPayload = purchase.getDeveloperPayload();
            if (actualPayload == null || !actualPayload.equals(checkPayload)) {
                cleanupActivePurchase(call, "PAYLOAD_MISMATCH", "اعتبارسنجی توکن تراکنش ناموفق بود (عدم تطابق پیلود).");
                return;
            }
        }

        // Step 9: consumeAsync immediately
        Log.i(TAG, "Purchase verified. Consuming consumable support product: " + purchase.getSku());
        try {
            mHelper.consumeAsync(purchase, new IabHelper.OnConsumeFinishedListener() {
                @Override
                public void onConsumeFinished(Purchase p, IabResult consumeResult) {
                    mPurchaseInProgress.set(false);

                    // Step 10: Report SUCCESS only after consume succeeds
                    if (consumeResult != null && consumeResult.isSuccess()) {
                        Log.i(TAG, "Purchase successfully consumed: " + p.getSku());
                        clearPersistedPendingPayload(p.getSku());

                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("sku", p.getSku());
                        ret.put("orderId", p.getOrderId() != null ? p.getOrderId() : "");
                        ret.put("purchaseTime", p.getPurchaseTime());
                        ret.put("purchaseToken", p.getToken() != null ? p.getToken() : "");
                        ret.put("developerPayload", p.getDeveloperPayload() != null ? p.getDeveloperPayload() : "");

                        mActivePurchaseCall = null;
                        call.resolve(ret);
                    } else {
                        String cErr = consumeResult != null ? consumeResult.getMessage() : "Unknown consumption error";
                        Log.e(TAG, "Consume failed for purchase: " + cErr);
                        cleanupActivePurchase(call, "CONSUME_FAILED", "خرید انجام شد اما ثبت مصرف آن در مایکت ناموفق بود: " + cErr);
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Exception during consumeAsync", e);
            cleanupActivePurchase(call, "CONSUME_EXCEPTION", "خطا در مصرف خرید: " + e.getMessage());
        }
    }

    /**
     * Recover an item that was already owned by consuming it and resolving the call.
     */
    private void recoverAndConsumeOwnedItem(final String targetSku, final PluginCall call) {
        if (mHelper == null) {
            cleanupActivePurchase(call, "BILLING_UNAVAILABLE", "سرویس مایکت در دسترس نیست.");
            return;
        }

        try {
            mHelper.queryInventoryAsync(false, new ArrayList<>(ALLOWED_SKUS), new IabHelper.QueryInventoryFinishedListener() {
                @Override
                public void onQueryInventoryFinished(IabResult result, Inventory inv) {
                    if (result == null || result.isFailure() || inv == null) {
                        cleanupActivePurchase(call, "RECOVERY_FAILED", "این مورد قبلاً خریداری شده اما دریافت اطلاعات آن جهت تایید مصرف ناموفق بود.");
                        return;
                    }

                    Purchase purchase = targetSku != null ? inv.getPurchase(targetSku) : null;
                    if (purchase == null) {
                        for (String s : ALLOWED_SKUS) {
                            if (inv.hasPurchase(s)) {
                                purchase = inv.getPurchase(s);
                                break;
                            }
                        }
                    }

                    if (purchase != null) {
                        final Purchase found = purchase;
                        mHelper.consumeAsync(found, new IabHelper.OnConsumeFinishedListener() {
                            @Override
                            public void onConsumeFinished(Purchase p, IabResult consumeResult) {
                                mPurchaseInProgress.set(false);
                                mActivePurchaseCall = null;

                                if (consumeResult != null && consumeResult.isSuccess()) {
                                    clearPersistedPendingPayload(found.getSku());

                                    JSObject ret = new JSObject();
                                    ret.put("success", true);
                                    ret.put("sku", found.getSku());
                                    ret.put("orderId", found.getOrderId() != null ? found.getOrderId() : "");
                                    ret.put("purchaseTime", found.getPurchaseTime());
                                    ret.put("purchaseToken", found.getToken() != null ? found.getToken() : "");
                                    ret.put("developerPayload", found.getDeveloperPayload() != null ? found.getDeveloperPayload() : "");
                                    ret.put("recovered", true);
                                    ret.put("message", "خرید پیشین با موفقیت بازیابی و مصرف شد.");

                                    // Emit recovery event
                                    notifyListeners("onPurchaseRecovered", ret);

                                    call.resolve(ret);
                                } else {
                                    call.reject("خطا در مصرف خرید پیشین.", "RECOVERY_CONSUME_FAILED");
                                }
                            }
                        });
                    } else {
                        cleanupActivePurchase(call, "PURCHASE_NOT_FOUND", "مورد قبلاً خریداری شده اما در فهرست خریدهای فعال مایکت یافت نشد.");
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error during recovery", e);
            cleanupActivePurchase(call, "RECOVERY_EXCEPTION", "خطا در بازیابی خرید پیشین: " + e.getMessage());
        }
    }

    /**
     * Public method to query and consume unconsumed purchases (recovery on app start / refresh).
     */
    @PluginMethod
    public void refreshPurchases(final PluginCall call) {
        recoverAndConsumePendingPurchases(call);
    }

    @PluginMethod
    public void consumePendingPurchases(final PluginCall call) {
        recoverAndConsumePendingPurchases(call);
    }

    private void recoverAndConsumePendingPurchases(final PluginCall call) {
        if (mHelper == null || !mIsSetupDone.get()) {
            if (call != null) {
                call.reject("سرویس خرید مایکت آماده نیست.", "BILLING_NOT_INITIALIZED");
            }
            return;
        }

        try {
            mHelper.queryInventoryAsync(false, new ArrayList<>(ALLOWED_SKUS), new IabHelper.QueryInventoryFinishedListener() {
                @Override
                public void onQueryInventoryFinished(IabResult result, Inventory inv) {
                    if (result == null || result.isFailure() || inv == null) {
                        if (call != null) {
                            call.resolve(new JSObject().put("consumedCount", 0));
                        }
                        return;
                    }

                    List<Purchase> toConsume = new ArrayList<>();
                    for (String sku : ALLOWED_SKUS) {
                        if (inv.hasPurchase(sku)) {
                            Purchase p = inv.getPurchase(sku);
                            if (p != null) {
                                toConsume.add(p);
                            }
                        }
                    }

                    if (toConsume.isEmpty()) {
                        if (call != null) {
                            call.resolve(new JSObject().put("consumedCount", 0));
                        }
                        return;
                    }

                    final int total = toConsume.size();
                    final int[] completed = {0};
                    final int[] succeeded = {0};

                    for (final Purchase p : toConsume) {
                        mHelper.consumeAsync(p, new IabHelper.OnConsumeFinishedListener() {
                            @Override
                            public void onConsumeFinished(Purchase purchase, IabResult cResult) {
                                completed[0]++;
                                if (cResult != null && cResult.isSuccess()) {
                                    succeeded[0]++;
                                    clearPersistedPendingPayload(purchase.getSku());

                                    JSObject recData = new JSObject();
                                    recData.put("sku", purchase.getSku());
                                    recData.put("orderId", purchase.getOrderId() != null ? purchase.getOrderId() : "");
                                    recData.put("purchaseTime", purchase.getPurchaseTime());
                                    recData.put("recovered", true);

                                    notifyListeners("onPurchaseRecovered", recData);
                                }
                                if (completed[0] == total && call != null) {
                                    JSObject res = new JSObject();
                                    res.put("consumedCount", succeeded[0]);
                                    call.resolve(res);
                                }
                            }
                        });
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error in recoverAndConsumePendingPurchases", e);
            if (call != null) {
                call.reject("خطا در مصرف خریدهای معلق: " + e.getMessage(), "CONSUME_PENDING_ERROR");
            }
        }
    }
}
