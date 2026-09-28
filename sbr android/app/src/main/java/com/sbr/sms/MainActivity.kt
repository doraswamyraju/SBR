package com.sbr.sms

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.core.content.ContextCompat
import com.sbr.sms.navigation.AppNavHost
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.theme.SBRTheme
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var userRepository: UserRepository

    private var pendingDeepLink = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        resolveIntentDeepLink(intent)

        setContent {
            SBRTheme {
                var showRationaleDialog by remember { mutableStateOf(false) }

                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { isGranted ->
                    // Permission result handled
                }

                LaunchedEffect(Unit) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        val status = ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            Manifest.permission.POST_NOTIFICATIONS
                        )
                        if (status != PackageManager.PERMISSION_GRANTED) {
                            if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                                showRationaleDialog = true
                            } else {
                                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                            }
                        }
                    }

                    // Synchronize FCM token with backend if authenticated
                    try {
                        val token = com.google.firebase.messaging.FirebaseMessaging.getInstance().token.await()
                        if (!token.isNullOrBlank()) {
                            userRepository.updateFcmToken(token)
                        }
                    } catch (_: Exception) {
                        // Suppressed if user is not authenticated or offline
                    }
                }

                if (showRationaleDialog) {
                    AlertDialog(
                        onDismissRequest = { showRationaleDialog = false },
                        icon = { Icon(Icons.Default.Notifications, contentDescription = null) },
                        title = { Text("Enable Notifications") },
                        text = {
                            Text(
                                "Sri Balaji Renewables needs notification access to send you live dispatch alerts, " +
                                "technician arrival updates, and invoice receipts."
                            )
                        },
                        confirmButton = {
                            Button(onClick = {
                                showRationaleDialog = false
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                            }) {
                                Text("Allow")
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showRationaleDialog = false }) {
                                Text("Not Now")
                            }
                        }
                    )
                }

                AppNavHost(
                    deepLinkRoute = pendingDeepLink.value,
                    onDeepLinkHandled = { pendingDeepLink.value = null }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        resolveIntentDeepLink(intent)
    }

    private fun resolveIntentDeepLink(intent: Intent?) {
        if (intent == null) return
        val requestId = intent.getStringExtra("requestId")
        val type = intent.getStringExtra("type")

        if (!requestId.isNullOrBlank()) {
            val route = when {
                type?.equals("agent_en_route", ignoreCase = true) == true ||
                type?.equals("job_accepted", ignoreCase = true) == true -> {
                    AppRoutes.CustomerLiveTracking.createRoute(requestId)
                }
                type?.startsWith("customer", ignoreCase = true) == true -> {
                    AppRoutes.CustomerRequestDetail.createRoute(requestId)
                }
                else -> {
                    AppRoutes.RequestDetail.createRoute(requestId)
                }
            }
            pendingDeepLink.value = route
        }
    }
}
