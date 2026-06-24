package com.sbr.sms.ui.agent.viewmodels

import android.Manifest
import android.app.Application
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.AgentDashboardStats
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.StorageRepository
import com.sbr.sms.data.repositories.UserRepository
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject


data class RequestWithCustomerDetails(
    val request: ServiceRequest,
    val customerName: String,
    val customerPhone: String?
)

sealed interface AgentDashboardUiState {
    object Loading : AgentDashboardUiState
    data class Success(
        val stats: AgentDashboardStats,
        val assignedRequests: List<RequestWithCustomerDetails>,
        val activeRequest: RequestWithCustomerDetails?
    ) : AgentDashboardUiState
    data class Error(val message: String) : AgentDashboardUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class AgentRequestsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    private val storageRepository: StorageRepository,
    private val auth: FirebaseAuth,
    private val application: Application,
    private val fusedLocationProviderClient: FusedLocationProviderClient
) : ViewModel() {

    private val _uiState = MutableStateFlow<AgentDashboardUiState>(AgentDashboardUiState.Loading)
    val uiState: StateFlow<AgentDashboardUiState> = _uiState.asStateFlow()

    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading.asStateFlow()

    private val _imageTypeToUpload = MutableStateFlow<String?>(null)
    val imageTypeToUpload: StateFlow<String?> = _imageTypeToUpload.asStateFlow()

    private val refreshTrigger = MutableStateFlow(0)
    private var locationCallback: LocationCallback? = null

    init {
        observeAgentData()
    }

    private fun observeAgentData() {
        viewModelScope.launch {
            val authStateFlow = callbackFlow {
                val listener = FirebaseAuth.AuthStateListener { firebaseAuth -> trySend(firebaseAuth.currentUser) }
                auth.addAuthStateListener(listener)
                awaitClose { auth.removeAuthStateListener(listener) }
            }

            authStateFlow.flatMapLatest { user ->
                if (user == null) {
                    flowOf(AgentDashboardUiState.Error("Agent not logged in."))
                } else {
                    val agentNameFlow = flow { emit(userRepository.getUser(user.uid)?.name ?: "Agent") }
                    val allRequestsFlow = serviceRequestRepository.getRequestsStreamForAgent(user.uid)
                    val todaysCollectionsFlow = serviceRequestRepository.getTodaysCollectionsStream(user.uid)
                        .catch { e ->
                            Log.e("AGENT_DEBUG", "Error fetching today's collections.", e)
                            emit(emptyList())
                        }

                    val requestsWithCustomerInfoFlow = allRequestsFlow.flatMapLatest { requests ->
                        val customerIds = requests.map { it.customerId }.distinct()
                        if (customerIds.isEmpty()) {
                            flowOf(emptyList())
                        } else {
                            userRepository.getUsersByIds(customerIds).map { customers ->
                                val customerMap = customers.associateBy { it.id }
                                requests.map { request ->
                                    val customer = customerMap[request.customerId] as? Customer
                                    RequestWithCustomerDetails(
                                        request = request,
                                        customerName = customer?.name ?: "Unknown Customer",
                                        customerPhone = customer?.phone
                                    )
                                }
                            }
                        }
                    }

                    combine(
                        agentNameFlow,
                        requestsWithCustomerInfoFlow,
                        todaysCollectionsFlow,
                        refreshTrigger
                    ) { agentName, allRequestsWithDetails, collections, _ ->

                        val newAssigned = allRequestsWithDetails.filter { it.request.status == "Assigned" }
                        val activeRequestDetails = allRequestsWithDetails.find {
                            it.request.status == "Accepted" || it.request.status == "In Progress" || it.request.status == "Completed" || it.request.status == "Paid"
                        }

                        val stats = AgentDashboardStats(
                            agentName = agentName,
                            activeRequestTitle = activeRequestDetails?.request?.serviceType ?: "No Active Job",
                            newAssignedRequests = newAssigned.size,
                            completedToday = collections.size,
                            todaysEarnings = collections.sumOf { it.paymentAmount ?: 0.0 }
                        )
                        AgentDashboardUiState.Success(stats, newAssigned, activeRequestDetails)
                    }
                }
            }.catch { e ->
                Log.e("AgentRequestsVM", "Error in data stream", e)
                emit(AgentDashboardUiState.Error(e.message ?: "An error occurred."))
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun acceptRequest(requestId: String) {
        updateRequestStatus(requestId, "Accepted")
    }

    fun updateRequestStatus(requestId: String, newStatus: String, requestReview: Boolean = false) {
        viewModelScope.launch {
            try {
                serviceRequestRepository.updateRequestStatus(requestId, newStatus, requestReview)
            } catch (e: Exception) {
                Log.e("AgentRequestsVM", "Failed to update status for $requestId", e)
            }
        }
    }

    fun handleImageUpload(requestId: String, imageUri: Uri, imageType: String, requestReview: Boolean = false) {
        viewModelScope.launch {
            _isUploading.value = true
            try {
                val imageUrl = storageRepository.uploadRequestImage(requestId, imageType, imageUri)
                serviceRequestRepository.updateRequestImage(requestId, imageUrl, imageType)
                if (imageType == "after") {
                    updateRequestStatus(requestId, "Completed", requestReview)
                }
                refreshTrigger.value++
            } catch (e: Exception) {
                Log.e("AgentRequestsVM", "Image upload failed for $requestId", e)
            } finally {
                _isUploading.value = false
            }
        }
    }

    fun setImageTypeToUpload(type: String) {
        _imageTypeToUpload.value = type
    }

    fun collectPayment(requestId: String, amount: Double, method: String) {
        viewModelScope.launch {
            try {
                serviceRequestRepository.updatePaymentDetails(requestId, amount, method)
                updateRequestStatus(requestId, "Paid")
                Log.d("AgentRequestsVM", "Payment details updated for $requestId")
            } catch (e: Exception) {
                Log.e("AgentRequestsVM", "Failed to update payment details for $requestId", e)
            }
        }
    }

    fun logout() {
        auth.signOut()
    }

    fun startLocationUpdates() {
        if (locationCallback != null) {
            Log.d("AgentLocation", "Location updates already active.")
            return
        }

        if (ContextCompat.checkSelfPermission(application, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.w("AgentLocation", "Fine location permission not granted.")
            return
        }

        val currentState = _uiState.value
        // FIXED: Access the 'id' through the nested 'request' object.
        val activeRequestId = (currentState as? AgentDashboardUiState.Success)?.activeRequest?.request?.id
        if (activeRequestId == null) {
            Log.w("AgentLocation", "Cannot start updates, no active request ID.")
            return
        }

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L)
            .setWaitForAccurateLocation(true)
            .setMinUpdateIntervalMillis(3000L)
            .build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    Log.d("AgentLocation", "New location: ${location.latitude}, ${location.longitude} (Accuracy: ${location.accuracy}m)")
                    val agentLocation = AgentLocation(
                        latitude = location.latitude,
                        longitude = location.longitude
                    )
                    viewModelScope.launch {
                        try {
                            serviceRequestRepository.updateAgentLocation(activeRequestId, agentLocation)
                        } catch (e: Exception) {
                            Log.e("AgentLocation", "Failed to update location in Firestore.", e)
                        }
                    }
                }
            }
        }

        fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback!!, Looper.getMainLooper())
        Log.d("AgentLocation", "Location updates started with high accuracy request.")
    }

    fun stopLocationUpdates() {
        locationCallback?.let {
            fusedLocationProviderClient.removeLocationUpdates(it)
            locationCallback = null
            Log.d("AgentLocation", "Location updates stopped.")
        }
    }
}