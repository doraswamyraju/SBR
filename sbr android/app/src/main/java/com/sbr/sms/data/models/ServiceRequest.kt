package com.sbr.sms.data.models

import java.util.Date

data class ServiceRequest(
    var id: String = "",
    val customerId: String = "",
    var assignedAgentId: String? = null,
    val serviceType: String = "",
    val description: String = "",
    val customerAddress: String = "",
    var status: String = "Pending",
    val createdBy: String = "CUSTOMER",
    val createdAt: Date? = null,
    val acceptedAt: Date? = null,
    val completedAt: Date? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val paymentAmount: Double? = null,
    val paymentStatus: String = "Pending",
    val paymentMethod: String? = null,
    val paymentTimestamp: Date? = null,
    val locationPath: List<AgentLocation> = emptyList()
)