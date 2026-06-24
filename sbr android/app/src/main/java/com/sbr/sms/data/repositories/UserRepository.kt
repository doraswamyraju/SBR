package com.sbr.sms.data.repositories

import com.sbr.sms.data.models.User
import kotlinx.coroutines.flow.Flow
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer

interface UserRepository {
    suspend fun getUser(uid: String): User?
    suspend fun createUser(user: User)
    suspend fun getAllUsers(): List<User>
    fun getAllUsersFlow(): Flow<List<User>>
    suspend fun updateAgentDetails(agent: Agent)
    suspend fun updateCustomer(customer: Customer)
    fun getUsersByIds(userIds: List<String>): Flow<List<User>>
    suspend fun deleteUser(userId: String)
    suspend fun login(email: String, password: String): User?
    suspend fun signup(name: String, email: String, password: String, role: String): User?
    suspend fun logout()
}