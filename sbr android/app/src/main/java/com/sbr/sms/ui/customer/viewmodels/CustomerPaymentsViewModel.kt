package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import javax.inject.Inject

/**
 * Holds the calculated stats for the summary cards.
 */
data class CustomerPaymentStats(
    val totalPaymentsMade: Double = 0.0,
    val freeServicesUsed: Int = 0
)

/**
 * The complete UI state for the CustomerPaymentsScreen.
 */
sealed interface CustomerPaymentsUiState {
    object Loading : CustomerPaymentsUiState
    data class Success(
        val stats: CustomerPaymentStats,
        val paymentHistory: List<ServiceRequest>
    ) : CustomerPaymentsUiState
    data class Error(val message: String) : CustomerPaymentsUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class CustomerPaymentsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    // This is the final state exposed to the UI.
    val uiState: StateFlow<CustomerPaymentsUiState> =
        flow { emit(auth.currentUser?.uid) }
            .flatMapLatest { customerId ->
                if (customerId == null) {
                    // If no user is logged in, return a flow containing just the Error state.
                    flowOf(CustomerPaymentsUiState.Error("User not logged in."))
                } else {
                    // Get the stream of paid requests for the current customer...
                    serviceRequestRepository.getCustomerPaymentHistoryStream(customerId)
                        // ...and map the result into a Success state INSIDE this block.
                        .map { history ->
                            // Calculate the stats from the payment history list.
                            val totalPaid = history.sumOf { it.paymentAmount ?: 0.0 }
                            // A "free" service is one marked as Paid but with a 0.0 amount.
                            val freeServices = history.count { (it.paymentAmount ?: 0.0) == 0.0 }

                            val stats = CustomerPaymentStats(
                                totalPaymentsMade = totalPaid,
                                freeServicesUsed = freeServices
                            )
                            // Emit the final success state with stats and the list.
                            CustomerPaymentsUiState.Success(stats, history)
                        }
                }
            }
            .catch { e -> emit(CustomerPaymentsUiState.Error(e.message ?: "An unknown error occurred.")) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = CustomerPaymentsUiState.Loading
            )
}