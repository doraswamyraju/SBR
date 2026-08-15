package com.sbr.sms.data.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

@JvmSuppressWildcards
interface ApiService {

    // Auth endpoints
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/auth/logout")
    suspend fun logout(@Body body: Map<String, String>): Response<ApiResponse<String>>

    // User endpoints
    @GET("api/users")
    suspend fun getAllUsers(): Response<ApiResponse<List<UserDto>>>

    @GET("api/users/{id}")
    suspend fun getUserById(@Path("id") id: String): Response<ApiResponse<UserDto>>

    @PUT("api/users/profile")
    suspend fun updateProfile(@Body fields: Map<String, Any>): Response<ApiResponse<UserDto>>

    @PUT("api/users/agent/location")
    suspend fun updateAgentCoordinates(@Body coordinates: Map<String, Double>): Response<ApiResponse<Map<String, Double>>>

    @PUT("api/users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body fields: Map<String, Any>): Response<ApiResponse<UserDto>>

    @DELETE("api/users/{id}")
    suspend fun deleteUser(@Path("id") id: String): Response<ApiResponse<Map<String, Any>>>

    // Service Request endpoints
    @POST("api/requests")
    suspend fun createRequest(@Body request: Map<String, String>): Response<ApiResponse<ServiceRequestDto>>

    @GET("api/requests")
    suspend fun getRequests(
        @Query("status") status: String? = null,
        @Query("paymentStatus") paymentStatus: String? = null
    ): Response<ApiResponse<List<ServiceRequestDto>>>

    @GET("api/requests/{id}")
    suspend fun getRequestById(@Path("id") id: String): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}")
    suspend fun updateRequest(@Path("id") id: String, @Body fields: Map<String, Any?>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/assign")
    suspend fun assignRequest(@Path("id") id: String, @Body body: Map<String, String>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/status")
    suspend fun updateRequestStatus(@Path("id") id: String, @Body body: Map<String, Any>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/image")
    suspend fun updateRequestImage(@Path("id") id: String, @Body body: Map<String, String>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/payment")
    suspend fun updatePaymentDetails(@Path("id") id: String, @Body body: Map<String, Any>): Response<ApiResponse<ServiceRequestDto>>

    @POST("api/requests/{id}/location")
    suspend fun appendAgentLocation(@Path("id") id: String, @Body coordinates: Map<String, Double>): Response<ApiResponse<List<AgentLocationDto>>>

    @DELETE("api/requests/{id}")
    suspend fun deleteRequest(@Path("id") id: String): Response<ApiResponse<Map<String, Any>>>

    // Upload endpoints
    @Multipart
    @POST("api/upload")
    suspend fun uploadImage(@Part file: MultipartBody.Part): Response<UploadResponse>

    // Customer List endpoints
    @GET("api/customer-list")
    suspend fun getCustomerList(
        @Query("search") search: String? = null,
        @Query("product") product: String? = null
    ): Response<CustomerListResponseDto>

    @POST("api/customer-list")
    suspend fun addCustomerRecord(
        @Body record: CustomerRecordDto
    ): Response<ApiResponse<CustomerRecordDto>>

    @DELETE("api/customer-list/{id}")
    suspend fun deleteCustomerRecord(
        @Path("id") id: String
    ): Response<ApiResponse<Map<String, Any>>>

    @DELETE("api/customer-list/clear")
    suspend fun clearCustomerList(): Response<ApiResponse<Map<String, Any>>>

    // Products & Services Endpoints
    @GET("api/products")
    suspend fun getProducts(
        @Query("activeOnly") activeOnly: Boolean = false,
        @Query("category") category: String? = null
    ): Response<ApiResponse<List<ProductDto>>>

    @POST("api/products")
    suspend fun createProduct(
        @Body product: ProductRequest
    ): Response<ApiResponse<ProductDto>>

    @PUT("api/products/{id}")
    suspend fun updateProduct(
        @Path("id") id: String,
        @Body product: ProductRequest
    ): Response<ApiResponse<ProductDto>>

    @DELETE("api/products/{id}")
    suspend fun deleteProduct(
        @Path("id") id: String
    ): Response<ApiResponse<Map<String, Any>>>

    // Referral Endpoints
    @GET("api/referrals/my-referrals")
    suspend fun getMyReferrals(): Response<ApiResponse<ReferralDashboardDto>>

    @POST("api/referrals/submit")
    suspend fun submitReferral(
        @Body request: SubmitReferralRequest
    ): Response<ApiResponse<ReferralDto>>

    @POST("api/referrals/claim-payout")
    suspend fun claimPayout(
        @Body request: ClaimPayoutRequest
    ): Response<ApiResponse<ReferralClaimDto>>

    @GET("api/referrals/admin/all")
    suspend fun getAdminAllReferrals(): Response<ApiResponse<List<ReferralDto>>>

    @GET("api/referrals/admin/claims")
    suspend fun getAdminAllClaims(): Response<ApiResponse<List<ReferralClaimDto>>>

    @PUT("api/referrals/admin/{id}/status")
    suspend fun updateReferralStatus(
        @Path("id") id: String,
        @Body request: UpdateReferralStatusRequest
    ): Response<ApiResponse<ReferralDto>>

    @PUT("api/referrals/admin/claims/{id}/status")
    suspend fun updateClaimStatus(
        @Path("id") id: String,
        @Body request: UpdateClaimStatusRequest
    ): Response<ApiResponse<ReferralClaimDto>>
}
