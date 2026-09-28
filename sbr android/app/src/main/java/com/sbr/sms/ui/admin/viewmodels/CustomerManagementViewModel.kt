package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CustomerManagementViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val statusMessage = MutableStateFlow<String?>(null)
    val errorMessage = MutableStateFlow<String?>(null)
    val isLoading = MutableStateFlow(false)

    val customers: StateFlow<List<Customer>> = userRepository.getAllUsersFlow()
        .combine(_searchQuery) { users, query ->
            val customers = users.mapNotNull { it as? Customer }
            if (query.isBlank()) {
                customers
            } else {
                customers.filter {
                    it.name.contains(query, ignoreCase = true) ||
                            it.phone?.contains(query, ignoreCase = true) == true
                }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun deleteCustomer(customerId: String) {
        viewModelScope.launch {
            try {
                userRepository.deleteUser(customerId)
                statusMessage.value = "Customer deleted successfully."
            } catch (e: Exception) {
                errorMessage.value = e.localizedMessage ?: "Failed to delete customer"
            }
        }
    }

    fun sendPasswordResetEmail(customerId: String) {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val res = userRepository.resetPasswordEmail(customerId)
                res.onSuccess {
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

    fun setManualPassword(customerId: String, newPass: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val res = userRepository.manualPasswordReset(customerId, newPass)
                res.onSuccess {
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

    fun clearMessages() {
        statusMessage.value = null
        errorMessage.value = null
    }
}