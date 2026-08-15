package com.sbr.sms.data.api

import com.google.gson.annotations.SerializedName

// Generic API response wrapper
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null
)

// Auth payloads
data class LoginRequest(
    val email: String,
    val password: String,
    val fcmToken: String? = null
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String,
    val phone: String? = null,
    val address: String? = null,
    val specialization: String? = null,
    val location: String? = null
)

data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserDto? = null,
    val error: String? = null
)

// User profiles
data class UserDto(
    @SerializedName("id", alternate = ["_id"]) val id: String,
    val name: String,
    val email: String,
    val role: String,
    val isAvailable: Boolean = true,
    val phone: String? = null,
    val address: String? = null,
    val photoUrl: String? = null,
    val isRecurring: Boolean = false,
    val nextServiceDate: String? = null, // Date strings from JSON
    val specialization: String? = null,
    val location: String? = null,
    val status: String? = null,
    val rating: Float = 0.0f,
    val completedJobs: Int = 0,
    val currentLat: Double? = null,
    val currentLng: Double? = null,
    val fcmTokens: List<String> = emptyList()
)

// Service Request details
data class ServiceRequestDto(
    @SerializedName("id", alternate = ["_id"]) val id: String,
    val customerId: Any?, // Can be UserDto or String depending on populate
    val assignedAgentId: Any? = null, // Can be UserDto or String depending on populate
    val serviceType: String,
    val description: String? = null,
    val customerAddress: String,
    val status: String,
    val createdBy: String,
    val createdAt: String? = null,
    val acceptedAt: String? = null,
    val completedAt: String? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val paymentAmount: Double? = null,
    val paymentStatus: String,
    val paymentMethod: String? = null,
    val paymentTimestamp: String? = null,
    val locationPath: List<AgentLocationDto> = emptyList()
)

data class AgentLocationDto(
    val latitude: Double,
    val longitude: Double,
    val timestamp: String? = null
)

// Upload response
data class UploadResponse(
    val success: Boolean,
    val url: String,
    val filename: String
)

// Customer List DTOs
data class CustomerRecordDto(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val sNo: String? = "",
    val name: String = "",
    val address: String? = "",
    val product: String? = "",
    val model: String? = "",
    val purchaseDate: String? = ""
)

data class CustomerListResponseDto(
    val success: Boolean = false,
    val count: Int? = 0,
    val products: List<String>? = emptyList(),
    val data: List<CustomerRecordDto>? = emptyList(),
    val message: String? = null,
    val error: String? = null
)

// Product DTOs
data class ProductDto(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val name: String = "",
    val slug: String? = null,
    val category: String? = null,
    val image: String? = null,
    val images: List<String>? = emptyList(),
    val subtitle: String? = null,
    val tagline: String? = null,
    val description: String? = null,
    val features: List<String>? = emptyList(),
    val basePrice: Double? = null,
    val mrp: Double? = null,
    val commissionType: String? = "fixed",
    val commissionValue: Double? = null,
    val isActive: Boolean? = true,
    val createdAt: String? = null
)

data class ProductRequest(
    val name: String,
    val slug: String? = null,
    val category: String,
    val image: String? = null,
    val images: List<String>? = emptyList(),
    val subtitle: String? = null,
    val tagline: String? = null,
    val description: String? = null,
    val features: List<String>? = emptyList(),
    val basePrice: Double? = null,
    val mrp: Double? = null,
    val commissionType: String? = "fixed",
    val commissionValue: Double? = null,
    val isActive: Boolean = true
)

// Referral DTOs
data class ReferralDto(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val referrerId: Any? = null,
    val referralCode: String = "",
    val refereeName: String = "",
    val refereePhone: String = "",
    val productId: String? = null,
    val productName: String = "",
    val rewardAmount: Double = 0.0,
    val notes: String? = null,
    val status: String = "Pending",
    val purchaseAmount: Double? = null,
    val createdAt: String? = null
)

data class ReferralClaimDto(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val userId: Any? = null,
    val userName: String = "",
    val userPhone: String = "",
    val amount: Double = 0.0,
    val payoutMethod: String = "",
    val payoutDetails: String = "",
    val status: String = "Pending",
    val transactionRef: String? = null,
    val adminNotes: String? = null,
    val createdAt: String? = null
)

data class ReferralDashboardDto(
    val referralCode: String = "",
    val totalInvited: Int = 0,
    val convertedCount: Int = 0,
    val totalEarnings: Double = 0.0,
    val claimedEarnings: Double = 0.0,
    val availableBalance: Double = 0.0,
    val pendingEarnings: Double = 0.0,
    val referrals: List<ReferralDto> = emptyList(),
    val claims: List<ReferralClaimDto> = emptyList()
)

data class SubmitReferralRequest(
    val refereeName: String,
    val refereePhone: String,
    val productId: String? = null,
    val productName: String,
    val notes: String? = null
)

data class ClaimPayoutRequest(
    val amount: Double,
    val payoutMethod: String,
    val payoutDetails: String
)

data class UpdateReferralStatusRequest(
    val status: String,
    val purchaseAmount: Double? = null,
    val rewardAmount: Double? = null,
    val notes: String? = null
)

data class UpdateClaimStatusRequest(
    val status: String,
    val transactionRef: String? = null,
    val adminNotes: String? = null
)
