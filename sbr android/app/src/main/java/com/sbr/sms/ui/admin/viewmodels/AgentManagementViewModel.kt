package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.User
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AgentManagementViewModel @Inject constructor(
    private val userRepo: UserRepository
) : ViewModel() {

    private val _agents = MutableStateFlow<List<User>>(emptyList())
    val agents: StateFlow<List<User>> = _agents.asStateFlow()

    init {
        observeAgents()
    }

    private fun observeAgents() {
        viewModelScope.launch {
            // FIX: Use the new getAllUsersFlow() function and filter for Agents.
            userRepo.getAllUsersFlow()
                .map { users ->
                    users.filter { it.role == UserRole.AGENT }
                }
                .catch { e ->
                    // Handle potential errors from the flow
                    println("Error observing agents: ${e.message}")
                    emit(emptyList())
                }
                .collect { agentList ->
                    _agents.value = agentList
                }
        }
    }

    fun toggleAgentStatus(agent: Agent, isActive: Boolean) {
        viewModelScope.launch {
            try {
                // We create a new object with the updated status
                val updatedAgent = agent.copy(status = if (isActive) "Active" else "Inactive")
                // We need a way to update a user. Let's assume userRepo has an updateUser method.
                // You will need to add this method to your UserRepository.
                userRepo.createUser(updatedAgent) // Using createUser to overwrite works as an update
            } catch (e: Exception) {
                // Handle error
                println("Failed to toggle agent status: ${e.message}")
            }
        }
    }
}