package com.sbr.sms.ui.customer.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ReferralClaimDto
import com.sbr.sms.data.api.ReferralDashboardDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.data.api.SubmitReferralRequest
import com.sbr.sms.data.api.ClaimPayoutRequest
import com.sbr.sms.data.repositories.ReferralRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReferralUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val dashboard: ReferralDashboardDto? = null,
    val products: List<ProductDto> = emptyList(),
    val isSubmittingReferral: Boolean = false,
    val referralSuccessMsg: String? = null,
    val referralErrorMsg: String? = null,
    val isSubmittingClaim: Boolean = false,
    val claimSuccessMsg: String? = null,
    val claimErrorMsg: String? = null
)

@HiltViewModel
class ReferralViewModel @Inject constructor(
    private val repository: ReferralRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReferralUiState())
    val uiState: StateFlow<ReferralUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val dashboardResult = repository.getMyReferrals()
            val productsResult = repository.getProducts()

            if (dashboardResult.isSuccess) {
                val dashboardData = dashboardResult.getOrNull()
                val productsData = productsResult.getOrDefault(emptyList())
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        dashboard = dashboardData,
                        products = productsData
                    )
                }
            } else {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = dashboardResult.exceptionOrNull()?.message ?: "Failed to load referral details"
                    )
                }
            }
        }
    }

    fun submitReferral(refereeName: String, refereePhone: String, productId: String?, productName: String, notes: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmittingReferral = true, referralSuccessMsg = null, referralErrorMsg = null) }
            val req = SubmitReferralRequest(refereeName, refereePhone, productId, productName, notes)
            val result = repository.submitReferral(req)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmittingReferral = false,
                        referralSuccessMsg = "Referral lead submitted successfully!"
                    )
                }
                loadData() // Refresh dashboard stats and lists
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmittingReferral = false,
                        referralErrorMsg = result.exceptionOrNull()?.message ?: "Failed to submit referral"
                    )
                }
            }
        }
    }

    fun claimPayout(amount: Double, payoutMethod: String, payoutDetails: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmittingClaim = true, claimSuccessMsg = null, claimErrorMsg = null) }
            val req = ClaimPayoutRequest(amount, payoutMethod, payoutDetails)
            val result = repository.claimPayout(req)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmittingClaim = false,
                        claimSuccessMsg = "Payout claim request submitted successfully!"
                    )
                }
                loadData() // Refresh dashboard stats and lists
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmittingClaim = false,
                        claimErrorMsg = result.exceptionOrNull()?.message ?: "Failed to claim payout"
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { 
            it.copy(
                referralSuccessMsg = null,
                referralErrorMsg = null,
                claimSuccessMsg = null,
                claimErrorMsg = null
            )
        }
    }
}
