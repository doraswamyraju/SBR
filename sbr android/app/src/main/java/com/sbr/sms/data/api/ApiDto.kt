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
