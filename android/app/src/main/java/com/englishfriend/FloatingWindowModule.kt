package com.englishfriend

import android.app.Activity
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class FloatingWindowModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FloatingWindowModule"

    @ReactMethod
    fun startService(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !Settings.canDrawOverlays(activity)
        ) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:${activity.packageName}")
            )
            activity.startActivity(intent)
            promise.reject("NO_PERMISSION", "Overlay permission required")
            return
        }

        val serviceIntent = Intent(activity, FloatingWindowService::class.java)
        activity.startForegroundService(serviceIntent)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        val activity = currentActivity
        if (activity != null) {
            val serviceIntent = Intent(activity, FloatingWindowService::class.java)
            activity.stopService(serviceIntent)
            promise.resolve(true)
        } else {
            promise.reject("NO_ACTIVITY", "No current activity")
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(FloatingWindowService.isRunning)
    }
}
