package com.sbr.sms.data.repositories

import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.ServiceRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import java.util.*

class FakeServiceRequestRepository : ServiceRequestRepository {

    private val _requests = MutableStateFlow<List<ServiceRequest>>(emptyList())
    val requests: Flow<List<ServiceRequest>> = _requests.asStateFlow()

    override suspend fun addRequest(request: ServiceRequest): String {
        val newId = UUID.randomUUID().toString()
        val newRequest = request.copy(id = newId, createdAt = Date())
        _requests.value += newRequest
        return newId
    }

    override suspend fun updateRequest(request: ServiceRequest) {
        val currentList = _requests.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == request.id }
        if (index != -1) {
            currentList[index] = request
            _requests.value = currentList
        }
    }

    override suspend fun deleteRequest(requestId: String) {
        _requests.value = _requests.value.filterNot { it.id == requestId }
    }

    override suspend fun getRequestById(requestId: String): ServiceRequest? {
        return _requests.value.find { it.id == requestId }
    }

    override fun getRequestStreamById(requestId: String): Flow<ServiceRequest?> {
        return requests.map { list ->
            list.find { it.id == requestId }
        }
    }

    override suspend fun getAllRequests(): List<ServiceRequest> {
        return _requests.value
    }

    override fun getAllRequestsStream(): Flow<List<ServiceRequest>> {
        return requests
    }

    override fun getRequestsStreamForAgent(agentId: String): Flow<List<ServiceRequest>> {
        return requests.map { list ->
            list.filter { it.assignedAgentId == agentId }
        }
    }

    override fun getRequestsStreamForCustomer(customerId: String): Flow<List<ServiceRequest>> {
        return requests.map { list ->
            list.filter { it.customerId == customerId }
        }
    }

    override fun getTodaysCollectionsStream(agentId: String): Flow<List<ServiceRequest>> {
        return requests.map { list ->
            list.filter { it.assignedAgentId == agentId && it.paymentStatus == "Paid" }
        }
    }

    override fun getPaymentHistoryStream(agentId: String): Flow<List<ServiceRequest>> {
        return getTodaysCollectionsStream(agentId)
    }

    override suspend fun assignRequest(requestId: String, agentId: String) {
        val request = getRequestById(requestId)
        request?.let {
            updateRequest(it.copy(status = "Assigned", assignedAgentId = agentId))
        }
    }

    override suspend fun updateRequestStatus(requestId: String, newStatus: String, requestReview: Boolean) {
        val request = getRequestById(requestId)
        request?.let {
            val updatedRequest = when (newStatus) {
                "Accepted" -> it.copy(status = newStatus, acceptedAt = Date())
                "Completed" -> it.copy(status = newStatus, completedAt = Date())
                else -> it.copy(status = newStatus)
            }
            updateRequest(updatedRequest)
        }
    }

    override suspend fun updateRequestImage(requestId: String, imageUrl: String, imageType: String) {
        val request = getRequestById(requestId)
        request?.let {
            val updatedRequest = if (imageType == "before") {
                it.copy(beforeImageUrl = imageUrl)
            } else {
                it.copy(afterImageUrl = imageUrl)
            }
            updateRequest(updatedRequest)
        }
    }

    override suspend fun updatePaymentDetails(requestId: String, amount: Double, method: String) {
        val request = getRequestById(requestId)
        request?.let {
            updateRequest(
                it.copy(
                    paymentAmount = amount,
                    paymentMethod = method,
                    paymentStatus = "Paid",
                    paymentTimestamp = Date()
                )
            )
        }
    }

    override suspend fun updateAgentLocation(requestId: String, location: AgentLocation) {
        val request = getRequestById(requestId)
        request?.let {
            // FIXED: Append the new location to the 'locationPath' list.
            val updatedPath = it.locationPath + location
            updateRequest(it.copy(locationPath = updatedPath))
        }
    }
    override fun getActiveRequestsStream(): Flow<List<ServiceRequest>> {
        return requests.map { allRequests ->
            allRequests.filter { it.status == "Accepted" || it.status == "In Progress" }
        }
    }
    override fun getPaidRequestsStream(): Flow<List<ServiceRequest>> {
        return requests.map { allRequests ->
            allRequests
                .filter { it.paymentStatus == "Paid" }
                .sortedByDescending { it.paymentTimestamp }
        }
    }
    override suspend fun getPaidRequestsInDateRange(startDate: Date, endDate: Date): List<ServiceRequest> {
        return _requests.value.filter {
            it.paymentStatus == "Paid" &&
                    it.paymentTimestamp != null &&
                    !it.paymentTimestamp.before(startDate) &&
                    !it.paymentTimestamp.after(endDate)
        }
    }
    override fun getCustomerPaymentHistoryStream(customerId: String): Flow<List<ServiceRequest>> {
        return requests.map { allRequests ->
            allRequests.filter { it.customerId == customerId && it.paymentStatus == "Paid" }
                .sortedByDescending { it.paymentTimestamp }
        }
    }
}