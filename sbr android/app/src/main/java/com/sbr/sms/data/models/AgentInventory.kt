package com.sbr.sms.data.models

data class ProductRef(
    val _id: String = "",
    val name: String = "",
    val sku: String? = null,
    val price: Double? = 0.0,
    val stockLevel: Int? = 0,
    val minStockLevel: Int? = 0
)

data class AgentInventoryItem(
    val _id: String = "",
    val agentId: String = "",
    val productId: ProductRef? = null,
    val quantity: Int = 0,
    val minAlertThreshold: Int = 2,
    val lastRestockedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val isLowStock: Boolean get() = quantity <= minAlertThreshold
}

data class IndentItem(
    val productId: ProductRef? = null,
    val name: String = "",
    val sku: String? = null,
    val requestedQuantity: Int = 1
)

data class AgentIndent(
    val _id: String = "",
    val agentId: HandoverUser? = null,
    val requestId: String? = null,
    val items: List<IndentItem> = emptyList(),
    val status: String = "PENDING", // PENDING, DISPATCHED, REJECTED
    val urgency: String? = "MEDIUM",
    val agentRemarks: String? = null,
    val inchargeRemarks: String? = null,
    val dispatchedBy: HandoverUser? = null,
    val dispatchedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
