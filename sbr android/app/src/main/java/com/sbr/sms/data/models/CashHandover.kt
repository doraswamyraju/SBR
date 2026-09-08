package com.sbr.sms.data.models

import com.google.gson.annotations.SerializedName

data class HandoverUser(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val name: String = "Unknown",
    val email: String? = null,
    val phone: String? = null
) {
    val _id: String get() = id
}

data class CashHandover(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val agentId: HandoverUser? = null,
    val date: String = "",
    @SerializedName("totalCollectedCash", alternate = ["totalCash"]) val totalCollectedCash: Double = 0.0,
    val completedRequests: List<Any> = emptyList(),
    val status: String = "SUBMITTED", // SUBMITTED, ACKNOWLEDGED, DISCREPANCY, NOT_SUBMITTED
    @SerializedName("acknowledgedBy", alternate = ["storeInchargeId"]) val acknowledgedBy: HandoverUser? = null,
    val storeInchargeId: HandoverUser? = null,
    val acknowledgedAmount: Double? = null,
    val discrepancyAmount: Double? = null,
    val inchargeNotes: String? = null,
    val agentNotes: String? = null,
    val submittedAt: String? = null,
    val acknowledgedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val _id: String get() = id
}

data class AgentDailySummary(
    val agentId: String = "",
    val date: String = "",
    @SerializedName("totalCollectedCash", alternate = ["totalCash"]) val totalCollectedCash: Double = 0.0,
    @SerializedName("completedJobsCount", alternate = ["requestCount"]) val completedJobsCount: Int = 0,
    @SerializedName("completedRequestIds", alternate = ["completedRequests"]) val completedRequestIds: List<Any> = emptyList(),
    @SerializedName("hasSubmittedHandover", alternate = ["alreadySubmitted"]) val hasSubmittedHandover: Boolean = false,
    @SerializedName("latestHandover", alternate = ["existingHandover"]) val latestHandover: CashHandover? = null
)
