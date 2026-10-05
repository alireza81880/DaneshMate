package com.daneshmate.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileOpenerPlugin.class);
        registerPlugin(MyketBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
