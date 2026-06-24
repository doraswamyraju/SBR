package com.sbr.sms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.sbr.sms.navigation.AppNavHost
import com.sbr.sms.ui.theme.SBRTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint // ✅ REQUIRED for Hilt to inject ViewModels
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SBRTheme {
                AppNavHost()
            }
        }
    }
}
