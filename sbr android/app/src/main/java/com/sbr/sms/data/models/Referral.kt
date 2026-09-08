package com.sbr.sms.data.models

import com.google.gson.annotations.SerializedName

data class Referral(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val referrerId: Any? = null,
    val referralCode: String = "",
    val refereeName: String = "",
    val refereePhone: String = "",
    val productId: String? = null,
    val productName: String = "",
    val rewardAmount: Double = 0.0,
    val notes: String? = null,
    val status: String = "Pending",
    val purchaseAmount: Double? = null,
    val createdAt: String? = null
)

data class ReferralClaim(
    @SerializedName("id", alternate = ["_id"]) val id: String = "",
    val userId: Any? = null,
    val userName: String = "",
    val userPhone: String = "",
    val amount: Double = 0.0,
    val payoutMethod: String = "", // UPI, BANK_TRANSFER, CASH_STORE
    val payoutDetails: String = "",
    val status: String = "Pending", // Pending, Approved, Rejected, Completed
    val transactionRef: String? = null,
    val adminNotes: String? = null,
    val createdAt: String? = null
)

data class ReferralDashboard(
    val referralCode: String = "",
    val totalInvited: Int = 0,
    val convertedCount: Int = 0,
    val totalEarnings: Double = 0.0,
    val claimedEarnings: Double = 0.0,
    val availableBalance: Double = 0.0,
    val pendingEarnings: Double = 0.0,
    val referrals: List<Referral> = emptyList(),
    val claims: List<ReferralClaim> = emptyList()
)
