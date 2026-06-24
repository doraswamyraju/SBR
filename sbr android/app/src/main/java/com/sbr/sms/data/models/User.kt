package com.sbr.sms.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.util.Date

enum class UserRole {
    ADMIN, AGENT, CUSTOMER
}

@Parcelize
sealed class User(
    open val id: String = "",
    open val name: String = "",
    open val email: String? = null,
    open val role: UserRole
) : Parcelable

@Parcelize
data class Admin(
    override val id: String = "",
    override val name: String = "",
    override val email: String? = null
) : User(id, name, email, UserRole.ADMIN)

@Parcelize
data class Agent(
    override val id: String = "",
    override val name: String = "",
    override val email: String? = null,
    val phone: String? = null,
    val isAvailable: Boolean = true,
    val specialization: String? = null,
    val location: String? = null,
    val status: String = "Offline",
    val rating: Float = 0.0f,
    val completedJobs: Int = 0,
    val currentLat: Double? = null,
    val currentLng: Double? = null
) : User(id, name, email, UserRole.AGENT)

@Parcelize
data class Customer(
    override val id: String = "",
    override val name: String = "",
    override val email: String? = null,
    val phone: String? = null,
    val address: String? = null,
    val photoUrl: String? = null,
    val isRecurring: Boolean = false,
    val nextServiceDate: Date? = null
) : User(id, name, email, UserRole.CUSTOMER)