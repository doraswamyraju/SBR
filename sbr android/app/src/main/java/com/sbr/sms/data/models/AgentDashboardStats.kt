package com.sbr.sms.data.models

// This data class holds the aggregated stats for the agent dashboard.
data class AgentDashboardStats(
    val agentName: String = "Agent",
    val activeRequestTitle: String = "No Active Job",
    val newAssignedRequests: Int = 0,
    val completedToday: Int = 0,
    val todaysEarnings: Double = 0.0
)