package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.ui.common.UiState
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class CustomerRequestsViewModel @Inject constructor(
    private val repository: ServiceRequestRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _customerRequests = MutableStateFlow<UiState<List<ServiceRequest>>>(UiState.Loading)
    val customerRequests: StateFlow<UiState<List<ServiceRequest>>> = _customerRequests.asStateFlow()

    init {
        loadCustomerRequests()
    }

    private fun loadCustomerRequests() {
        viewModelScope.launch {
            val authStateFlow = callbackFlow {
                val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
                    trySend(firebaseAuth.currentUser)
                }
                auth.addAuthStateListener(listener)
                awaitClose { auth.removeAuthStateListener(listener) }
            }

            authStateFlow.flatMapLatest { user ->
                if (user == null) {
                    flowOf(UiState.Error("User not logged in."))
                } else {
                    repository.getRequestsStreamForCustomer(user.uid)
                        .map { requests ->
                            if (requests.isNotEmpty()) {
                                UiState.Success(requests)
                            } else {
                                UiState.Empty
                            }
                        }
                }
            }.catch { e ->
                emit(UiState.Error(e.message ?: "Error loading requests"))
            }.collect { state ->
                _customerRequests.value = state
            }
        }
    }
}