package com.ahn90073.mange

import android.content.Context
import android.content.SharedPreferences
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "DeviceStorage")
class DeviceStoragePlugin : Plugin() {
    private val preferences: SharedPreferences by lazy {
        activity.getSharedPreferences("mange_device_storage", Context.MODE_PRIVATE)
    }

    @PluginMethod
    fun set(call: PluginCall) {
        val key = call.getString("key")
        val value = call.getString("value")
        if (key.isNullOrBlank() || value == null) {
            call.reject("key and value are required")
            return
        }
        preferences.edit().putString(key, value).apply()
        call.resolve()
    }

    @PluginMethod
    fun get(call: PluginCall) {
        val key = call.getString("key")
        if (key.isNullOrBlank()) {
            call.reject("key is required")
            return
        }
        val result = JSObject()
        preferences.getString(key, null)?.let { result.put("value", it) }
        call.resolve(result)
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        val key = call.getString("key")
        if (key.isNullOrBlank()) {
            call.reject("key is required")
            return
        }
        preferences.edit().remove(key).apply()
        call.resolve()
    }
}
