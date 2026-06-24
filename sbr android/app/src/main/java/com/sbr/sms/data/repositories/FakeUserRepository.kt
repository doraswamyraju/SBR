package com.sbr.sms.data.repositories

import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.User
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class FakeUserRepository : UserRepository {

    private val users = mutableListOf<User>()
    private val usersFlow = MutableStateFlow(users.toList())

    override suspend fun getUser(uid: String): User? {
        return users.find { it.id == uid }
    }

    override suspend fun createUser(user: User) {
        users.removeAll { it.id == user.id }
        users.add(user)
        usersFlow.value = users.toList()
    }

    override suspend fun updateAgentDetails(agent: Agent) {
        // Find the user by ID, remove them, and add the updated agent profile.
        users.removeAll { it.id == agent.id }
        users.add(agent)
        usersFlow.value = users.toList()
    }

    override suspend fun getAllUsers(): List<User> {
        return users.toList()
    }

    override fun getAllUsersFlow(): Flow<List<User>> {
        return usersFlow.asStateFlow()
    }

    override suspend fun updateCustomer(customer: Customer) {
        users.removeAll { it.id == customer.id }
        users.add(customer)
        usersFlow.value = users.toList()
    }

    // NEW: Implementation for the missing function to keep the fake repository in sync.
    override fun getUsersByIds(userIds: List<String>): Flow<List<User>> {
        return usersFlow.map { allUsers ->
            allUsers.filter { it.id in userIds }
        }
    }
    override suspend fun deleteUser(userId: String) {
        users.removeAll { it.id == userId }
        usersFlow.value = users.toList()
    }
}