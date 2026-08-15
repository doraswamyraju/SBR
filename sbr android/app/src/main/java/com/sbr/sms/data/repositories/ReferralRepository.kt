package com.sbr.sms.data.repositories

import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.ClaimPayoutRequest
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ReferralClaimDto
import com.sbr.sms.data.api.ReferralDashboardDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.data.api.SubmitReferralRequest
import com.sbr.sms.data.api.UpdateClaimStatusRequest
import com.sbr.sms.data.api.UpdateReferralStatusRequest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReferralRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getMyReferrals(): Result<ReferralDashboardDto> {
        return try {
            val response = apiService.getMyReferrals()
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to fetch referral dashboard"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProducts(): Result<List<ProductDto>> {
        return try {
            val response = apiService.getProducts(activeOnly = true)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to fetch products"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitReferral(request: SubmitReferralRequest): Result<ReferralDto> {
        return try {
            val response = apiService.submitReferral(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to submit referral lead"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun claimPayout(request: ClaimPayoutRequest): Result<ReferralClaimDto> {
        return try {
            val response = apiService.claimPayout(request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to claim payout"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Admin Endpoints
    suspend fun getAdminAllReferrals(): Result<List<ReferralDto>> {
        return try {
            val response = apiService.getAdminAllReferrals()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to fetch admin referrals"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAdminAllClaims(): Result<List<ReferralClaimDto>> {
        return try {
            val response = apiService.getAdminAllClaims()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()?.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to fetch admin claims"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateReferralStatus(id: String, request: UpdateReferralStatusRequest): Result<ReferralDto> {
        return try {
            val response = apiService.updateReferralStatus(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to update referral status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateClaimStatus(id: String, request: UpdateClaimStatusRequest): Result<ReferralClaimDto> {
        return try {
            val response = apiService.updateClaimStatus(id, request)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error ?: "Failed to update claim status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
