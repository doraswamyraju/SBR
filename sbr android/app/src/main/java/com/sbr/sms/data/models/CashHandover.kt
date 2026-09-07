package com.sbr.sms.data.models

data class HandoverUser(
    val _id: String = "",
    val name: String = "",
    val email: String? = null,
    val phone: String? = null
)

data class CashHandover(
    val _id: String = "",
    val agentId: HandoverUser? = null,
    val date: String = "",
    val totalCollectedCash: Double = 0.0,
    val completedRequests: List<String> = emptyList(),
    val status: String = "SUBMITTED", // SUBMITTED, ACKNOWLEDGED, DISCREPANCY
    val acknowledgedBy: HandoverUser? = null,
    val acknowledgedAmount: Double? = null,
    val discrepancyAmount: Double? = null,
    val inchargeNotes: String? = null,
    val agentNotes: String? = null,
    val submittedAt: String? = null,
    val acknowledgedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

data class AgentDailySummary(
    val agentId: String = "",
    val date: String = "",
    val totalCollectedCash: Double = 0.0,
    val completedJobsCount: Int = 0,
    val completedRequestIds: List<String> = emptyList(),
    val hasSubmittedHandover: Boolean = false,
    val latestHandover: CashHandover? = null
)
