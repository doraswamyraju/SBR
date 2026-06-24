package com.sbr.sms.data.models

import android.os.Parcelable
import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.IgnoreExtraProperties
import kotlinx.parcelize.Parcelize

enum class UserRole {
    ADMIN, AGENT, CUSTOMER
}

@Parcelize
@IgnoreExtraProperties
sealed class User(
    open val id: String = "",
    open val name: String = "",
    open val email: String? = null,
    open val role: UserRole
) : Parcelable {
    companion object {
        fun from(snapshot: DocumentSnapshot): User? {
            try {
                val roleName = snapshot.getString("role")
                val baseId = snapshot.id
                val baseName = snapshot.getString("name") ?: ""
                val baseEmail = snapshot.getString("email")

                return when (roleName) {
                    UserRole.ADMIN.name -> Admin(
                        id = baseId,
                        name = baseName,
                        email = baseEmail
                    )
                    UserRole.AGENT.name -> Agent(
                        id = baseId,
                        name = baseName,
                        email = baseEmail,
                        phone = snapshot.getString("phone"),
                        isAvailable = snapshot.getBoolean("isAvailable") ?: true,
                        specialization = snapshot.getString("specialization"),
                        location = snapshot.getString("location"),
                        status = snapshot.getString("status") ?: "Offline",
                        rating = (snapshot.get("rating") as? Number)?.toFloat() ?: 0.0f,
                        completedJobs = (snapshot.get("completedJobs") as? Number)?.toInt() ?: 0,
                        currentLat = snapshot.getDouble("currentLat"),
                        currentLng = snapshot.getDouble("currentLng")
                    )
                    UserRole.CUSTOMER.name -> Customer(
                        id = baseId,
                        name = baseName,
                        email = baseEmail,
                        phone = snapshot.getString("phone"),
                        address = snapshot.getString("address"),
                        photoUrl = snapshot.getString("photoUrl"),
                        isRecurring = snapshot.getBoolean("isRecurring") ?: false,
                        nextServiceDate = snapshot.getTimestamp("nextServiceDate")
                    )
                    else -> {
                        Log.e("UserMapper", "Unknown or null role '$roleName' for user ${snapshot.id}")
                        null
                    }
                }
            } catch (e: Exception) {
                Log.e("UserMapper", "Error deserializing user ${snapshot.id}", e)
                return null
            }
        }
    }
}

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
    val nextServiceDate: Timestamp? = null
) : User(id, name, email, UserRole.CUSTOMER)