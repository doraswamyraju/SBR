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
    val agentId: Any? = null,
    val date: String = "",
    @SerializedName("totalCollectedCash", alternate = ["totalCash", "amount", "collectedCash"]) val totalCollectedCash: Double = 0.0,
    val completedRequests: List<Any> = emptyList(),
    val status: String = "SUBMITTED", // SUBMITTED, ACKNOWLEDGED, DISCREPANCY, NOT_SUBMITTED
    val acknowledgedBy: Any? = null,
    val storeInchargeId: Any? = null,
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

    val resolvedAgentName: String
        get() {
            if (agentId is Map<*, *>) {
                val n = agentId["name"] ?: agentId["email"]
                if (n is String && n.isNotBlank()) return n
            }
            return "Agent"
        }

    val agentUser: HandoverUser?
        get() {
            if (agentId is Map<*, *>) {
                val nameVal = (agentId["name"] ?: agentId["email"]) as? String ?: "Field Agent"
                val phoneVal = agentId["phone"] as? String
                val emailVal = agentId["email"] as? String
                val idVal = (agentId["_id"] ?: agentId["id"]) as? String ?: ""
                return HandoverUser(id = idVal, name = nameVal, email = emailVal, phone = phoneVal)
            }
            if (agentId is String && agentId.isNotBlank()) {
                return HandoverUser(id = agentId, name = "Field Agent")
            }
            return null
        }
}

data class AgentDailySummary(
    val agentId: Any? = null,
    val date: String = "",
    @SerializedName("totalCollectedCash", alternate = ["totalCash", "amount", "collectedCash"]) val totalCollectedCash: Double = 0.0,
    @SerializedName("completedJobsCount", alternate = ["requestCount", "jobsCount"]) val completedJobsCount: Int = 0,
    @SerializedName("completedRequestIds", alternate = ["completedRequests"]) val completedRequestIds: List<Any> = emptyList(),
    @SerializedName("hasSubmittedHandover", alternate = ["alreadySubmitted", "submitted"]) val hasSubmittedHandover: Boolean = false,
    @SerializedName("latestHandover", alternate = ["existingHandover", "handover"]) val latestHandover: CashHandover? = null
)
