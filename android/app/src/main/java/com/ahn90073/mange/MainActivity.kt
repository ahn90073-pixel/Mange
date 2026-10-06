package com.ahn90073.mange

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(DeviceStoragePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
