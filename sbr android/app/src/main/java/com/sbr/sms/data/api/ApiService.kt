package com.sbr.sms.data.api

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

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
    suspend fun updateRequestStatus(@Path("id") id: String, @Body body: Map<String, String>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/image")
    suspend fun updateRequestImage(@Path("id") id: String, @Body body: Map<String, String>): Response<ApiResponse<ServiceRequestDto>>

    @PUT("api/requests/{id}/payment")
    suspend fun updatePaymentDetails(@Path("id") id: String, @Body body: Map<String, Any>): Response<ApiResponse<ServiceRequestDto>>

    @POST("api/requests/{id}/location")
    suspend fun appendAgentLocation(@Path("id") id: String, @Body coordinates: Map<String, Double>): Response<ApiResponse<List<AgentLocationDto>>>

    // Upload endpoints
    @Multipart
    @POST("api/upload")
    suspend fun uploadImage(@Part file: MultipartBody.Part): Response<UploadResponse>
}
