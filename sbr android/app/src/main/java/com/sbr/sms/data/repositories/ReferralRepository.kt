package com.sbr.sms.data.repositories

import com.sbr.sms.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReferralRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getMyReferrals(): Result<ReferralDashboardDto> {
        return try {
            val response = apiService.getMyReferrals()
            if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                Result.success(response.body()!!.data ?: throw Exception("Empty dashboard data"))
            } else {
                Result.failure(Exception(response.body()?.error ?: response.errorBody()?.string() ?: "Failed to load referrals"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProducts(): Result<List<ProductDto>> {
        return try {
            val response = apiService.getProducts()
            if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                Result.success(response.body()!!.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error ?: response.errorBody()?.string() ?: "Failed to load products"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitReferral(request: SubmitReferralRequest): Result<ReferralDto> {
        return try {
            val response = apiService.submitReferral(request)
            if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                Result.success(response.body()!!.data ?: throw Exception("Submission failed"))
            } else {
                Result.failure(Exception(response.body()?.error ?: response.errorBody()?.string() ?: "Failed to submit referral"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun claimPayout(request: ClaimPayoutRequest): Result<ReferralClaimDto> {
        return try {
            val response = apiService.claimPayout(request)
            if (response.isSuccessful && response.body() != null && response.body()!!.success) {
                Result.success(response.body()!!.data ?: throw Exception("Claim request failed"))
            } else {
                Result.failure(Exception(response.body()?.error ?: response.errorBody()?.string() ?: "Failed to claim payout"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
