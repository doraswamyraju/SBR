package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

sealed interface CreateRequestUiState {
    object Idle : CreateRequestUiState
    object Loading : CreateRequestUiState
    object Success : CreateRequestUiState
    data class Error(val message: String) : CreateRequestUiState
}

@HiltViewModel
class AdminCreateRequestViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val serviceRequestRepository: ServiceRequestRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<CreateRequestUiState>(CreateRequestUiState.Idle)
    val uiState: StateFlow<CreateRequestUiState> = _uiState.asStateFlow()

    val allCustomers: StateFlow<List<Customer>> = userRepository.getAllUsersFlow()
        .map { users -> users.mapNotNull { it as? Customer } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedCustomer = MutableStateFlow<Customer?>(null)
    val selectedCustomer: StateFlow<Customer?> = _selectedCustomer.asStateFlow()

    private val _serviceType = MutableStateFlow("")
    val serviceType: StateFlow<String> = _serviceType.asStateFlow()

    private val _description = MutableStateFlow("")
    val description: StateFlow<String> = _description.asStateFlow()

    private val _isRecurring = MutableStateFlow(false)
    val isRecurring: StateFlow<Boolean> = _isRecurring.asStateFlow()

    init {
        savedStateHandle.getLiveData<String>("newly_created_customer_id").observeForever { newId ->
            if(newId != null) {
                viewModelScope.launch {
                    val newCustomer = userRepository.getUser(newId) as? Customer
                    _selectedCustomer.value = newCustomer
                    savedStateHandle.remove<String>("newly_created_customer_id")
                }
            }
        }
    }

    fun onCustomerSelected(customer: Customer) { _selectedCustomer.value = customer }
    fun onServiceTypeChange(type: String) { _serviceType.value = type }
    fun onDescriptionChange(desc: String) { _description.value = desc }
    fun onRecurringChange(isChecked: Boolean) { _isRecurring.value = isChecked }

    fun createRequest() {
        val customer = _selectedCustomer.value
        val service = _serviceType.value

        if (customer == null) {
            _uiState.value = CreateRequestUiState.Error("Please select a customer.")
            return
        }
        if (service.isBlank()) {
            _uiState.value = CreateRequestUiState.Error("Service Type cannot be empty.")
            return
        }

        viewModelScope.launch {
            _uiState.value = CreateRequestUiState.Loading
            try {
                // First, create the service request
                val request = ServiceRequest(
                    customerId = customer.id,
                    serviceType = service,
                    description = _description.value,
                    customerAddress = customer.address ?: "No address provided",
                    createdBy = "ADMIN"
                )
                serviceRequestRepository.addRequest(request)

                // ✅ Second, if recurring, update the customer's profile
                if (_isRecurring.value) {
                    // Calculate next service date (3 months from now)
                    val calendar = Calendar.getInstance()
                    calendar.add(Calendar.MONTH, 3)
                    val nextDateTimestamp = calendar.time

                    // Create an updated customer object with the new date and save it
                    val updatedCustomer = customer.copy(
                        isRecurring = true,
                        nextServiceDate = nextDateTimestamp
                    )
                    userRepository.updateCustomer(updatedCustomer)
                }

                _uiState.value = CreateRequestUiState.Success
            } catch (e: Exception) {
                _uiState.value = CreateRequestUiState.Error(e.message ?: "Failed to create request.")
            }
        }
    }
}