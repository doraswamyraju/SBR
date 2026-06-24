package com.sbr.sms.data.repositories

import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.ServiceRequest
import kotlinx.coroutines.flow.Flow
import java.util.Date // NEW: Import for Date

interface ServiceRequestRepository {
    fun getRequestStreamById(requestId: String): Flow<ServiceRequest?>
    suspend fun addRequest(request: ServiceRequest): String
    suspend fun updateRequest(request: ServiceRequest)
    suspend fun deleteRequest(requestId: String)
    suspend fun getRequestById(requestId: String): ServiceRequest?
    suspend fun getAllRequests(): List<ServiceRequest>
    fun getAllRequestsStream(): Flow<List<ServiceRequest>>
    fun getRequestsStreamForAgent(agentId: String): Flow<List<ServiceRequest>>
    fun getRequestsStreamForCustomer(customerId: String): Flow<List<ServiceRequest>>
    fun getTodaysCollectionsStream(agentId: String): Flow<List<ServiceRequest>>
    fun getPaymentHistoryStream(agentId: String): Flow<List<ServiceRequest>>
    suspend fun assignRequest(requestId: String, agentId: String)
    suspend fun updateRequestStatus(requestId: String, newStatus: String, requestReview: Boolean = false)
    suspend fun updateRequestImage(requestId: String, imageUrl: String, imageType: String)
    suspend fun updatePaymentDetails(requestId: String, amount: Double, method: String)
    suspend fun updateAgentLocation(requestId: String, location: AgentLocation)
    fun getActiveRequestsStream(): Flow<List<ServiceRequest>>
    fun getPaidRequestsStream(): Flow<List<ServiceRequest>>
    suspend fun getPaidRequestsInDateRange(startDate: Date, endDate: Date): List<ServiceRequest>
    fun getCustomerPaymentHistoryStream(customerId: String): Flow<List<ServiceRequest>>
}