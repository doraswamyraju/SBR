package com.sbr.sms.data.models

import java.util.Date

data class RequiredComponent(
    val posProductId: Int? = null,
    val productId: String? = null,
    val name: String = "",
    val sku: String? = null,
    val quantity: Int = 1,
    val unitPrice: Double? = null
)

data class ServiceRequest(
    var id: String = "",
    val customerId: String = "",
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerEmail: String? = null,
    var assignedAgentId: String? = null,
    val assignedAgentName: String? = null,
    val assignedAgentPhone: String? = null,
    val serviceType: String = "",
    val description: String = "",
    val customerAddress: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    var status: String = "Pending",
    val createdBy: String = "CUSTOMER",
    val createdAt: Date? = null,
    val updatedAt: Date? = null,
    val acceptedAt: Date? = null,
    val completedAt: Date? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val paymentAmount: Double? = null,
    val inventoryTotal: Double? = null,
    val serviceCharge: Double? = null,
    val discount: Double? = null,
    val discountRemarks: String? = null,
    val finalAmount: Double? = null,
    val paymentStatus: String = "Pending",
    val paymentMethod: String? = null,
    val paymentTimestamp: Date? = null,
    val locationPath: List<AgentLocation> = emptyList(),
    val requiredComponents: List<RequiredComponent> = emptyList(),
    val requestReview: Boolean? = null
) {
    fun resolveUrl(urlStr: String?): String? {
        if (urlStr.isNullOrBlank()) return null
        var corrected = urlStr
        if (corrected.contains("localhost") || corrected.contains("127.0.0.1")) {
            corrected = corrected.replace(Regex("https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?", RegexOption.IGNORE_CASE), "https://sbr.sriddha.com")
        }
        if (corrected.startsWith("http://", ignoreCase = true)) {
            corrected = "https://" + corrected.substring(7)
        }
        if (!corrected.startsWith("http://", ignoreCase = true) && !corrected.startsWith("https://", ignoreCase = true)) {
            val base = "https://sbr.sriddha.com"
            corrected = if (corrected.startsWith("/")) base + corrected else "$base/$corrected"
        }
        return corrected
    }

    val resolvedBeforeImageUrl: String? get() = resolveUrl(beforeImageUrl)
    val resolvedAfterImageUrl: String? get() = resolveUrl(afterImageUrl)
}