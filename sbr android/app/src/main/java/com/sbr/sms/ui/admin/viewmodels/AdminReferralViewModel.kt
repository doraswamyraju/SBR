package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ReferralClaimDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.data.api.UpdateClaimStatusRequest
import com.sbr.sms.data.api.UpdateReferralStatusRequest
import com.sbr.sms.data.repositories.ReferralRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AdminReferralUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMsg: String? = null,
    val referrals: List<ReferralDto> = emptyList(),
    val claims: List<ReferralClaimDto> = emptyList(),
    val isSubmitting: Boolean = false
)

@HiltViewModel
class AdminReferralViewModel @Inject constructor(
    private val repository: ReferralRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminReferralUiState())
    val uiState: StateFlow<AdminReferralUiState> = _uiState.asStateFlow()

    init {
        loadAdminData()
    }

    fun loadAdminData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val referralsResult = repository.getAdminAllReferrals()
            val claimsResult = repository.getAdminAllClaims()

            _uiState.update { 
                it.copy(
                    isLoading = false,
                    referrals = referralsResult.getOrDefault(emptyList()),
                    claims = claimsResult.getOrDefault(emptyList()),
                    error = referralsResult.exceptionOrNull()?.message ?: claimsResult.exceptionOrNull()?.message
                )
            }
        }
    }

    fun updateReferralStatus(id: String, status: String, purchaseAmount: Double?, rewardAmount: Double?, notes: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, successMsg = null) }
            val req = UpdateReferralStatusRequest(status, purchaseAmount, rewardAmount, notes)
            val result = repository.updateReferralStatus(id, req)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        successMsg = "Referral lead updated successfully!"
                    )
                }
                loadAdminData()
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to update referral"
                    )
                }
            }
        }
    }

    fun updateClaimStatus(id: String, status: String, transactionRef: String?, adminNotes: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, successMsg = null) }
            val req = UpdateClaimStatusRequest(status, transactionRef, adminNotes)
            val result = repository.updateClaimStatus(id, req)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        successMsg = "Payout claim updated successfully!"
                    )
                }
                loadAdminData()
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to update claim"
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMsg = null) }
    }
}
