package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.CustomerDashboardStats
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import com.sbr.sms.ui.common.UiState
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Date
import javax.inject.Inject

sealed interface CustomerDashboardUiState {
    object Loading : CustomerDashboardUiState
    data class Success(
        val stats: CustomerDashboardStats,
        val nextServiceDate: Date?,
        val activeTrackableJob: ServiceRequest? = null
    ) : CustomerDashboardUiState
    data class Error(val message: String) : CustomerDashboardUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class CustomerDashboardViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    private val credentialManager: CredentialManager,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _requests = MutableStateFlow<List<ServiceRequest>>(emptyList())
    private val _userName = MutableStateFlow("Customer")
    private val _error = MutableStateFlow<String?>(null)
    private val _nextServiceDate = MutableStateFlow<Date?>(null)
    private val _customerProfile = MutableStateFlow<Customer?>(null)
    val customerProfile: StateFlow<Customer?> = _customerProfile.asStateFlow()

    val uiState: StateFlow<CustomerDashboardUiState> = combine(
        _requests, _userName, _error, _nextServiceDate
    ) { requests, name, error, nextDate ->
        if (error != null) {
            CustomerDashboardUiState.Error(error)
        } else {
            val activeTrackable = requests.firstOrNull {
                (it.status == "Assigned" || it.status == "Accepted" || it.status == "In Progress") &&
                        !it.assignedAgentId.isNullOrBlank()
            }
            val stats = CustomerDashboardStats(
                customerName = name,
                activeRequests = requests.count { it.status == "Assigned" || it.status == "Accepted" || it.status == "In Progress" || it.status == "Pending" },
                pendingPayments = requests.filter {
                    (it.status == "Completed" || it.status == "Paid") &&
                    !it.paymentStatus.equals("Paid", ignoreCase = true)
                }.sumOf { it.finalAmount ?: it.paymentAmount ?: 0.0 },
                recentActivities = requests.filter { it.createdAt != null }.sortedByDescending { it.createdAt }.take(5)
            )
            CustomerDashboardUiState.Success(stats, nextDate, activeTrackable)
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = CustomerDashboardUiState.Loading
    )

    private val _submissionStatus = MutableStateFlow<UiState<Unit>>(UiState.Idle)
    val submissionStatus: StateFlow<UiState<Unit>> = _submissionStatus.asStateFlow()

    init {
        observeAuthenticationState()
    }

    private fun observeAuthenticationState() {
        viewModelScope.launch {
            val savedUserId = credentialManager.savedUserId.first()
            val userId = if (savedUserId.isNotBlank()) savedUserId else auth.currentUser?.uid
            if (!userId.isNullOrBlank()) {
                _error.value = null
                fetchUserData(userId)
                observeRequests(userId)
            } else {
                val authStateFlow = callbackFlow {
                    val listener = FirebaseAuth.AuthStateListener { firebaseAuth -> trySend(firebaseAuth.currentUser) }
                    auth.addAuthStateListener(listener)
                    awaitClose { auth.removeAuthStateListener(listener) }
                }

                authStateFlow.collect { user ->
                    if (user != null) {
                        _error.value = null
                        fetchUserData(user.uid)
                        observeRequests(user.uid)
                    } else {
                        _error.value = "You are not logged in."
                    }
                }
            }
        }
    }

    fun refreshCustomerData() {
        viewModelScope.launch {
            val savedUserId = credentialManager.savedUserId.first()
            val userId = if (savedUserId.isNotBlank()) savedUserId else auth.currentUser?.uid
            if (!userId.isNullOrBlank()) {
                fetchUserData(userId)
                observeRequests(userId)
            }
        }
    }

    private fun fetchUserData(uid: String) {
        viewModelScope.launch {
            val user = userRepository.getUser(uid)
            if (user is Customer) {
                _customerProfile.value = user
                _userName.value = user.name
                _nextServiceDate.value = user.nextServiceDate
            } else if (user != null) {
                _userName.value = user.name
                _nextServiceDate.value = null
            } else {
                _userName.value = "Valued Customer"
                _nextServiceDate.value = null
            }
        }
    }

    private fun observeRequests(uid: String) {
        viewModelScope.launch {
            serviceRequestRepository.getRequestsStreamForCustomer(uid)
                .catch { e ->
                    _error.value = e.message ?: "Failed to load requests."
                }
                .collect { requests ->
                    _requests.value = requests
                }
        }
    }

    fun submitNewRequest(
        serviceType: String,
        description: String,
        address: String,
        latitude: Double? = null,
        longitude: Double? = null
    ) {
        viewModelScope.launch {
            val savedUserId = credentialManager.savedUserId.first()
            val uid = if (savedUserId.isNotBlank()) savedUserId else auth.currentUser?.uid
            if (uid.isNullOrBlank()) {
                _submissionStatus.value = UiState.Error("User is not logged in.")
                return@launch
            }
            _submissionStatus.value = UiState.Loading
            try {
                val newRequest = ServiceRequest(
                    customerId = uid,
                    serviceType = serviceType,
                    description = description,
                    customerAddress = address,
                    latitude = latitude,
                    longitude = longitude,
                    createdBy = "CUSTOMER"
                )
                serviceRequestRepository.addRequest(newRequest)
                _submissionStatus.value = UiState.Success(Unit)
            } catch (e: Exception) {
                _submissionStatus.value = UiState.Error(e.message ?: "An unknown error occurred.")
            }
        }
    }

    fun resetSubmissionStatus() {
        _submissionStatus.value = UiState.Idle
    }
}