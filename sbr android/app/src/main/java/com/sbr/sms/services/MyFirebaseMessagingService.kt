package com.sbr.sms.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.sbr.sms.MainActivity
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MyFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var userRepository: UserRepository

    private val tag = "MyFirebaseMsgService"

    companion object {
        const val CHANNEL_DISPATCH = "sbr_dispatch"
        const val CHANNEL_FINANCE = "sbr_finance"
        const val CHANNEL_INVENTORY = "sbr_inventory"
        const val CHANNEL_UPDATES = "sbr_updates"
    }

    override fun onCreate() {
        super.onCreate()
        setupNotificationChannels()
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(tag, "Refreshed FCM token: $token")
        CoroutineScope(Dispatchers.IO).launch {
            try {
                userRepository.updateFcmToken(token)
            } catch (e: Exception) {
                Log.e(tag, "Error uploading refreshed FCM token", e)
            }
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(tag, "Received FCM message from: ${remoteMessage.from}")

        // 1. Resolve Title and Body
        var title = remoteMessage.notification?.title
        var body = remoteMessage.notification?.body

        if (title.isNullOrEmpty() && body.isNullOrEmpty()) {
            title = remoteMessage.data["title"]
            body = remoteMessage.data["body"]
        }

        if (title.isNullOrEmpty() && body.isNullOrEmpty()) {
            Log.d(tag, "FCM Message contained no displayable title or body. Data: ${remoteMessage.data}")
            return
        }

        // 2. Resolve Payload Extras
        val data = remoteMessage.data
        val requestId = data["requestId"]
        val handoverId = data["handoverId"]
        val indentId = data["indentId"]
        val type = data["type"] ?: "GENERAL"

        // 3. Resolve Notification Channel
        val channelId = when {
            type.contains("HANDOVER", ignoreCase = true) || type.contains("PAYMENT", ignoreCase = true) -> CHANNEL_FINANCE
            type.contains("INDENT", ignoreCase = true) || type.contains("STOCK", ignoreCase = true) -> CHANNEL_INVENTORY
            requestId != null || type.contains("REQUEST", ignoreCase = true) || type.contains("ASSIGN", ignoreCase = true) -> CHANNEL_DISPATCH
            else -> CHANNEL_UPDATES
        }

        sendNotification(
            title = title ?: "SBR Service Alert",
            body = body ?: "",
            channelId = channelId,
            requestId = requestId,
            handoverId = handoverId,
            indentId = indentId,
            type = type
        )
    }

    private fun sendNotification(
        title: String,
        body: String,
        channelId: String,
        requestId: String?,
        handoverId: String?,
        indentId: String?,
        type: String?
    ) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            requestId?.let { putExtra("requestId", it) }
            handoverId?.let { putExtra("handoverId", it) }
            indentId?.let { putExtra("indentId", it) }
            type?.let { putExtra("type", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(com.sbr.sms.R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(
                if (channelId == CHANNEL_DISPATCH || channelId == CHANNEL_FINANCE) {
                    NotificationCompat.PRIORITY_HIGH
                } else {
                    NotificationCompat.PRIORITY_DEFAULT
                }
            )
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        setupNotificationChannels()
        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }

    private fun setupNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val dispatchChannel = NotificationChannel(
                CHANNEL_DISPATCH,
                "Service Dispatches & Live Tracking",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent service assignments, customer arrival, and live location updates"
                enableLights(true)
                enableVibration(true)
            }

            val financeChannel = NotificationChannel(
                CHANNEL_FINANCE,
                "Cash Handovers & Payments",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Cash handover submissions, approvals, and customer payments"
                enableLights(true)
                enableVibration(true)
            }

            val inventoryChannel = NotificationChannel(
                CHANNEL_INVENTORY,
                "Van Inventory & Indents",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Stock indent requests, approvals, and dispatch notifications"
                enableLights(true)
            }

            val updatesChannel = NotificationChannel(
                CHANNEL_UPDATES,
                "General Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "System notifications and announcements"
            }

            notificationManager.createNotificationChannels(
                listOf(dispatchChannel, financeChannel, inventoryChannel, updatesChannel)
            )
        }
    }
}
