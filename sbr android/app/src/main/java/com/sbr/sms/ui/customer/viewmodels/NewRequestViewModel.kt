package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NewRequestViewModel @Inject constructor(
    private val repository: ServiceRequestRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    fun submitRequest(serviceType: String, description: String, address: String) {
        val currentUser = auth.currentUser ?: return
        viewModelScope.launch {
            val newRequest = ServiceRequest(
                customerId = currentUser.uid,
                // FIXED: The customerName is no longer stored on the request object itself.
                serviceType = serviceType,
                description = description,
                customerAddress = address,
                status = "Pending"
            )
            repository.addRequest(newRequest)
        }
    }
}