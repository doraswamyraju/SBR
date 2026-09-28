package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AgentDetailsViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    val isLoading = MutableStateFlow(false)
    val statusMessage = MutableStateFlow<String?>(null)
    val errorMessage = MutableStateFlow<String?>(null)

    fun updateAgent(agent: Agent, onComplete: () -> Unit = {}) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null
            try {
                userRepository.updateAgentDetails(agent)
                statusMessage.value = "Agent details updated successfully."
                onComplete()
            } catch (e: Exception) {
                errorMessage.value = e.localizedMessage ?: "Failed to update agent"
            } finally {
                isLoading.value = false
            }
        }
    }

    fun sendPasswordResetEmail(agentId: String) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null
            try {
                val result = userRepository.resetPasswordEmail(agentId)
                result.onSuccess {
                    statusMessage.value = it
                }.onFailure {
                    errorMessage.value = it.localizedMessage ?: "Failed to send reset email"
                }
            } catch (e: Exception) {
                errorMessage.value = e.localizedMessage
            } finally {
                isLoading.value = false
            }
        }
    }

    fun setManualPassword(agentId: String, newPass: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null
            try {
                val result = userRepository.manualPasswordReset(agentId, newPass)
                result.onSuccess {
                    statusMessage.value = it
                    onSuccess()
                }.onFailure {
                    errorMessage.value = it.localizedMessage ?: "Failed to update password"
                }
            } catch (e: Exception) {
                errorMessage.value = e.localizedMessage
            } finally {
                isLoading.value = false
            }
        }
    }

    fun deleteAgent(agentId: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            isLoading.value = true
            errorMessage.value = null
            try {
                userRepository.deleteUser(agentId)
                statusMessage.value = "Agent account deleted successfully."
                onSuccess()
            } catch (e: Exception) {
                errorMessage.value = e.localizedMessage ?: "Failed to delete agent"
            } finally {
                isLoading.value = false
            }
        }
    }

    fun clearMessages() {
        statusMessage.value = null
        errorMessage.value = null
    }
}
