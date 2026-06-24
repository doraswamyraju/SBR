package com.sbr.sms.data.models

import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class AgentLocation(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    // NEW: Add a timestamp that will be automatically populated by the Firestore server.
    @get:ServerTimestamp val timestamp: Date? = null
)