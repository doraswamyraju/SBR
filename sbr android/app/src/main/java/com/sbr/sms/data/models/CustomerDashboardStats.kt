package com.sbr.sms.data.models

data class CustomerDashboardStats(
    val activeRequests: Int = 0,
    val pendingPayments: Double = 0.0,
    val availableCredits: Double = 0.0,
    val userRating: Float = 0.0f,
    val recentActivities: List<ServiceRequest> = emptyList(),
    val customerName: String = "Customer"
)