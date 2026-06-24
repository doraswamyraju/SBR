package com.sbr.sms.data.models

// This class holds all the calculated statistics for the dashboard.
// I have removed the duplicate 'AgentPerformance' data class from this file.
data class DashboardStats(
    val totalRequests: Int = 0,
    val activeAgents: Int = 0,
    val pendingPayments: Int = 0,
    val customerSatisfaction: Float = 0.0f,
    // This will hold the most recent requests with a "Pending" status.
    val recentPendingRequests: List<ServiceRequest> = emptyList()
)
