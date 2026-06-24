package com.sbr.sms.data.repositories

import android.util.Log
import com.sbr.sms.data.models.*
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.UserDto
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.api.LoginRequest
import com.sbr.sms.data.api.RegisterRequest
import com.sbr.sms.data.api.AuthResponse
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.first
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepositoryImpl @Inject constructor(
    private val apiService: ApiService,
    private val credentialManager: CredentialManager
) : UserRepository {

    private val tag = "UserRepository"

    private val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private fun formatDate(date: Date?): String? {
        return date?.let { isoDateFormat.format(it) }
    }

    private fun parseDate(dateStr: String?): Date? {
        if (dateStr.isNullOrBlank()) return null
        return try {
            isoDateFormat.parse(dateStr)
        } catch (e: Exception) {
            try {
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.parse(dateStr)
            } catch (ex: Exception) {
                null
            }
        }
    }

    // Helper mapper from DTO to domain model
    private fun UserDto.toDomain(): User {
        return when (this.role) {
            "ADMIN" -> Admin(
                id = this.id,
                name = this.name,
                email = this.email
            )
            "AGENT" -> Agent(
                id = this.id,
                name = this.name,
                email = this.email,
                phone = this.phone,
                isAvailable = this.isAvailable,
                specialization = this.specialization,
                location = this.location,
                status = this.status ?: "Offline",
                rating = this.rating,
                completedJobs = this.completedJobs,
                currentLat = this.currentLat,
                currentLng = this.currentLng
            )
            else -> Customer(
                id = this.id,
                name = this.name,
                email = this.email,
                phone = this.phone,
                address = this.address,
                photoUrl = this.photoUrl,
                isRecurring = this.isRecurring,
                nextServiceDate = this.nextServiceDate?.let { parseDate(it) }
            )
        }
    }

    // Map domain model to a payload map for API updates
    private fun userToFields(user: User): Map<String, Any> {
        val fields = mutableMapOf<String, Any>()
        fields["name"] = user.name
        fields["email"] = user.email ?: ""
        fields["role"] = user.role.name
        
        when (user) {
            is Customer -> {
                user.phone?.let { fields["phone"] = it }
                user.address?.let { fields["address"] = it }
                user.photoUrl?.let { fields["photoUrl"] = it }
                fields["isRecurring"] = user.isRecurring
                user.nextServiceDate?.let { 
                    formatDate(it)?.let { dateStr ->
                        fields["nextServiceDate"] = dateStr
                    }
                }
            }
            is Agent -> {
                user.phone?.let { fields["phone"] = it }
                user.specialization?.let { fields["specialization"] = it }
                user.location?.let { fields["location"] = it }
                fields["status"] = user.status
                fields["isAvailable"] = user.isAvailable
                fields["rating"] = user.rating
                fields["completedJobs"] = user.completedJobs
                user.currentLat?.let { fields["currentLat"] = it }
                user.currentLng?.let { fields["currentLng"] = it }
            }
            else -> {}
        }
        return fields
    }

    override suspend fun getUser(uid: String): User? {
        return try {
            val response = apiService.getUserById(uid)
            if (response.isSuccessful) {
                response.body()?.data?.toDomain()
            } else {
                Log.e(tag, "Failed to get user: ${response.errorBody()?.string()}")
                null
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting user $uid", e)
            null
        }
    }

    override suspend fun createUser(user: User) {
        try {
            val fields = userToFields(user)
            val response = apiService.updateUser(user.id, fields)
            if (!response.isSuccessful) {
                val errorMsg = response.errorBody()?.string()
                Log.e(tag, "Failed to create/update user: $errorMsg")
                throw Exception("Failed to create/update user: $errorMsg")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error creating user ${user.id}", e)
            throw e
        }
    }

    override suspend fun updateCustomer(customer: Customer) {
        try {
            val fields = userToFields(customer)
            val isSelf = customer.id == credentialManager.savedUserId.first()
            val response = if (isSelf) {
                apiService.updateProfile(fields)
            } else {
                apiService.updateUser(customer.id, fields)
            }
            if (!response.isSuccessful) {
                throw Exception("Failed to update customer: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error updating customer ${customer.id}", e)
            throw e
        }
    }

    override suspend fun updateAgentDetails(agent: Agent) {
        try {
            val fields = userToFields(agent)
            val isSelf = agent.id == credentialManager.savedUserId.first()
            val response = if (isSelf) {
                apiService.updateProfile(fields)
            } else {
                apiService.updateUser(agent.id, fields)
            }
            if (!response.isSuccessful) {
                throw Exception("Failed to update agent details: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error updating agent details ${agent.id}", e)
            throw e
        }
    }

    override suspend fun getAllUsers(): List<User> {
        return try {
            val response = apiService.getAllUsers()
            if (response.isSuccessful) {
                response.body()?.data?.map { it.toDomain() } ?: emptyList()
            } else {
                Log.e(tag, "Failed to get all users: ${response.errorBody()?.string()}")
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting all users", e)
            emptyList()
        }
    }

    override fun getAllUsersFlow(): Flow<List<User>> = flow {
        emit(getAllUsers())
    }

    override fun getUsersByIds(userIds: List<String>): Flow<List<User>> = flow {
        // Fetch all users and filter locally to match the list of IDs
        val all = getAllUsers()
        emit(all.filter { it.id in userIds })
    }

    override suspend fun deleteUser(userId: String) {
        try {
            val response = apiService.deleteUser(userId)
            if (!response.isSuccessful) {
                throw Exception("Failed to delete user: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error deleting user $userId", e)
            throw e
        }
    }

    override suspend fun login(email: String, password: String): User? {
        try {
            val fcmToken = try {
                com.google.firebase.messaging.FirebaseMessaging.getInstance().token.await()
            } catch (e: Exception) {
                null
            }

            val response = apiService.login(LoginRequest(email, password, fcmToken))
            if (response.isSuccessful) {
                val authBody = response.body()
                if (authBody != null && authBody.success && authBody.token != null && authBody.user != null) {
                    val user = authBody.user.toDomain()
                    credentialManager.saveAuthSession(
                        token = authBody.token,
                        userId = user.id,
                        name = user.name,
                        role = authBody.user.role,
                        email = user.email ?: email
                    )
                    return user
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error during login", e)
        }
        return null
    }

    override suspend fun signup(name: String, email: String, password: String, role: String): User? {
        try {
            val response = apiService.register(
                RegisterRequest(
                    name = name,
                    email = email,
                    password = password,
                    role = role
                )
            )
            if (response.isSuccessful) {
                val authBody = response.body()
                if (authBody != null && authBody.success && authBody.token != null && authBody.user != null) {
                    val user = authBody.user.toDomain()
                    credentialManager.saveAuthSession(
                        token = authBody.token,
                        userId = user.id,
                        name = user.name,
                        role = authBody.user.role,
                        email = user.email ?: email
                    )
                    return user
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error during signup", e)
        }
        return null
    }

    override suspend fun logout() {
        try {
            val fcmToken = try {
                com.google.firebase.messaging.FirebaseMessaging.getInstance().token.await()
            } catch (e: Exception) {
                ""
            }
            apiService.logout(mapOf("fcmToken" to fcmToken))
        } catch (e: Exception) {
            Log.e(tag, "Error during logout", e)
        } finally {
            credentialManager.clearAuthSession()
        }
    }
}