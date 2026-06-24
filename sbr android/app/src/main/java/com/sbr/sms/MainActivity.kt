package com.sbr.sms

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.sbr.sms.navigation.AppNavHost
import com.sbr.sms.ui.theme.SBRTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint // ✅ REQUIRED for Hilt to inject ViewModels
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS runtime permission for Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    102
                )
            }
        }

        setContent {
            SBRTheme {
                AppNavHost()
            }
        }
    }
}
