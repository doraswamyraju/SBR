package com.sbr.sms.data.models

import com.google.gson.annotations.SerializedName

enum class IndentStatus(val displayName: String) {
    REQUESTED("Pending Store Review"),
    PENDING("Pending Store Review"),
    APPROVED("Approved"),
    DISPATCHED("Dispatched to Van"),
    REJECTED("Rejected")
}

data class ProductRef(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val name: String = "",
    val sku: String? = null,
    val price: Double? = 0.0,
    val stockLevel: Int? = 0,
    val minStockLevel: Int? = 0
) {
    val _id: String get() = id
}

data class AgentInventoryItem(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val agentId: String = "",
    val productId: ProductRef? = null,
    val quantity: Int = 0,
    val minAlertThreshold: Int = 2,
    val lastRestockedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val _id: String get() = id
    val isLowStock: Boolean get() = quantity <= minAlertThreshold
}

data class IndentItem(
    val posProductId: Int? = null,
    val productId: Any? = null,
    @SerializedName("name", alternate = ["productName"]) val name: String = "Spare Part",
    val sku: String? = null,
    @SerializedName("requestedQuantity", alternate = ["quantity"]) val requestedQuantity: Int = 1,
    val dispatchedQuantity: Int? = null
) {
    val resolvedProductId: String
        get() {
            if (productId is String) return productId
            if (productId is Map<*, *>) {
                val idVal = productId["id"] ?: productId["_id"]
                if (idVal is String) return idVal
            }
            return ""
        }
}

data class AgentIndent(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val agentId: HandoverUser? = null,
    @SerializedName("serviceRequestId", alternate = ["requestId"]) val serviceRequestId: String? = null,
    val items: List<IndentItem> = emptyList(),
    val status: String = "PENDING", // PENDING, REQUESTED, APPROVED, DISPATCHED, REJECTED
    val urgency: String? = "MEDIUM", // LOW, MEDIUM, HIGH, CRITICAL
    val agentRemarks: String? = null,
    val inchargeRemarks: String? = null,
    @SerializedName("storeInchargeId", alternate = ["dispatchedBy"]) val storeInchargeId: HandoverUser? = null,
    val requestedAt: String? = null,
    val dispatchedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val _id: String get() = id
}
