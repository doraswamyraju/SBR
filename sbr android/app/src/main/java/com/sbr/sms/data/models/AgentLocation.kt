package com.sbr.sms.data.models

import java.util.Date

data class AgentLocation(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val timestamp: Date? = null
)