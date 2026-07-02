package com.flashops.hubchecklist;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(FlashProofWebViewPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
