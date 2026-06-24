package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CreateRequestViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.getAllUsersFlow()
                .map { users -> users.filterIsInstance<Customer>() }
                .collect { customerList -> _customers.value = customerList }
        }
    }

    fun submitNewRequest(
        selectedCustomer: Customer,
        serviceType: String,
        description: String
    ) {
        viewModelScope.launch {
            val newRequest = ServiceRequest(
                customerId = selectedCustomer.id,
                customerAddress = selectedCustomer.address ?: "N/A",
                serviceType = serviceType,
                description = description
            )
            serviceRequestRepository.addRequest(newRequest)
        }
    }
}