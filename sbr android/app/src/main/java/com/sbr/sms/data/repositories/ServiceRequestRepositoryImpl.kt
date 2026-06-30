package com.sbr.sms.data.repositories

import android.util.Log
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.ServiceRequestDto
import com.sbr.sms.data.api.AgentLocationDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.merge
import kotlinx.coroutines.flow.MutableSharedFlow
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ServiceRequestRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : ServiceRequestRepository {

    private val tag = "ServiceRequestRepo"

    private val refreshTrigger = MutableSharedFlow<Unit>(replay = 1).apply { tryEmit(Unit) }

    fun triggerRefresh() {
        refreshTrigger.tryEmit(Unit)
    }

    private val tickerFlow = flow {
        while (true) {
            kotlinx.coroutines.delay(10000)
            emit(Unit)
        }
    }

    private val requestsUpdatesFlow = merge(refreshTrigger, tickerFlow)

    private val isoDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    private fun parseDate(dateStr: String?): Date? {
        if (dateStr.isNullOrBlank()) return null
        return try {
            isoDateFormat.parse(dateStr)
        } catch (e: Exception) {
            try {
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }.parse(dateStr)
            } catch (ex: Exception) {
                null
            }
        }
    }

    // Safely extract string ID from nested populated DTO field or flat string field
    private fun getObjectId(field: Any?): String {
        if (field == null) return ""
        if (field is String) return field
        if (field is Map<*, *>) {
            val idVal = field["id"] ?: field["_id"]
            if (idVal is String) return idVal
        }
        return ""
    }

    private fun ServiceRequestDto.toDomain(): ServiceRequest {
        return ServiceRequest(
            id = this.id,
            customerId = getObjectId(this.customerId),
            assignedAgentId = getObjectId(this.assignedAgentId).takeIf { it.isNotBlank() },
            serviceType = this.serviceType,
            description = this.description ?: "",
            customerAddress = this.customerAddress,
            status = this.status,
            createdBy = this.createdBy,
            createdAt = this.createdAt?.let { parseDate(it) },
            acceptedAt = this.acceptedAt?.let { parseDate(it) },
            completedAt = this.completedAt?.let { parseDate(it) },
            beforeImageUrl = this.beforeImageUrl,
            afterImageUrl = this.afterImageUrl,
            paymentAmount = this.paymentAmount,
            paymentStatus = this.paymentStatus,
            paymentMethod = this.paymentMethod,
            paymentTimestamp = this.paymentTimestamp?.let { parseDate(it) },
            locationPath = this.locationPath.map {
                AgentLocation(
                    latitude = it.latitude,
                    longitude = it.longitude,
                    timestamp = it.timestamp?.let { ts -> parseDate(ts) }
                )
            }
        )
    }

    override fun getRequestStreamById(requestId: String): Flow<ServiceRequest?> = flow {
        while (true) {
            try {
                emit(getRequestById(requestId))
            } catch (e: Exception) {
                Log.e(tag, "Error fetching request stream", e)
            }
            kotlinx.coroutines.delay(10000)
        }
    }

    override suspend fun addRequest(request: ServiceRequest): String {
        try {
            val payload = mapOf(
                "customerId" to request.customerId,
                "serviceType" to request.serviceType,
                "description" to request.description,
                "customerAddress" to request.customerAddress
            )
            val response = apiService.createRequest(payload)
            if (response.isSuccessful) {
                val newId = response.body()?.data?.id ?: ""
                triggerRefresh()
                return newId
            } else {
                throw Exception("Failed to add request: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error adding request", e)
            throw e
        }
    }

    override suspend fun updateRequest(request: ServiceRequest) {
        try {
            val payload = mapOf(
                "serviceType" to request.serviceType,
                "description" to request.description,
                "customerAddress" to request.customerAddress,
                "status" to request.status,
                "beforeImageUrl" to request.beforeImageUrl,
                "afterImageUrl" to request.afterImageUrl,
                "paymentAmount" to request.paymentAmount,
                "paymentStatus" to request.paymentStatus,
                "paymentMethod" to request.paymentMethod
            )
            val response = apiService.updateRequest(request.id, payload)
            if (!response.isSuccessful) {
                throw Exception("Failed to update request: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error updating request ${request.id}", e)
            throw e
        }
    }

    override suspend fun deleteRequest(requestId: String) {
        try {
            val response = apiService.deleteRequest(requestId)
            if (!response.isSuccessful) {
                throw Exception("Failed to delete request: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error deleting request $requestId", e)
            throw e
        }
    }

    override suspend fun getRequestById(requestId: String): ServiceRequest? {
        return try {
            val response = apiService.getRequestById(requestId)
            if (response.isSuccessful) {
                response.body()?.data?.toDomain()
            } else {
                Log.e(tag, "Failed to get request details: ${response.errorBody()?.string()}")
                null
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting request details $requestId", e)
            null
        }
    }

    override suspend fun getAllRequests(): List<ServiceRequest> {
        return try {
            val response = apiService.getRequests()
            if (response.isSuccessful) {
                response.body()?.data?.map { it.toDomain() } ?: emptyList()
            } else {
                Log.e(tag, "Failed to get all requests: ${response.errorBody()?.string()}")
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting all requests", e)
            emptyList()
        }
    }

    override fun getAllRequestsStream(): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests()
    }

    override fun getRequestsStreamForAgent(agentId: String): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter { it.assignedAgentId == agentId }
    }

    override fun getRequestsStreamForCustomer(customerId: String): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter { it.customerId == customerId }
    }

    override fun getTodaysCollectionsStream(agentId: String): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0); calendar.set(Calendar.MINUTE, 0); calendar.set(Calendar.SECOND, 0)
        val startOfToday = calendar.time
        
        getAllRequests().filter {
            it.assignedAgentId == agentId &&
            it.paymentStatus == "Paid" &&
            it.paymentTimestamp != null &&
            it.paymentTimestamp.after(startOfToday)
        }
    }

    override fun getPaymentHistoryStream(agentId: String): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter {
            it.assignedAgentId == agentId &&
            it.paymentStatus == "Paid"
        }
    }

    override suspend fun assignRequest(requestId: String, agentId: String) {
        try {
            val response = apiService.assignRequest(requestId, mapOf("agentId" to agentId))
            if (!response.isSuccessful) {
                throw Exception("Failed to assign request: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error assigning request $requestId", e)
            throw e
        }
    }

    override suspend fun updateRequestStatus(requestId: String, newStatus: String, requestReview: Boolean) {
        try {
            val response = apiService.updateRequestStatus(
                requestId,
                mapOf("status" to newStatus, "requestReview" to requestReview)
            )
            if (!response.isSuccessful) {
                throw Exception("Failed to update status: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error updating request status $requestId", e)
            throw e
        }
    }

    override suspend fun updateRequestImage(requestId: String, imageUrl: String, imageType: String) {
        try {
            val response = apiService.updateRequestImage(
                requestId,
                mapOf("imageUrl" to imageUrl, "imageType" to imageType)
            )
            if (!response.isSuccessful) {
                throw Exception("Failed to update request image: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error updating request image $requestId", e)
            throw e
        }
    }

    override suspend fun updatePaymentDetails(requestId: String, amount: Double, method: String) {
        try {
            val response = apiService.updatePaymentDetails(
                requestId,
                mapOf("amount" to amount, "method" to method)
            )
            if (!response.isSuccessful) {
                throw Exception("Failed to update payment details: ${response.errorBody()?.string()}")
            }
            triggerRefresh()
        } catch (e: Exception) {
            Log.e(tag, "Error updating payment details $requestId", e)
            throw e
        }
    }

    override suspend fun updateAgentLocation(requestId: String, location: AgentLocation) {
        try {
            val response = apiService.appendAgentLocation(
                requestId,
                mapOf("latitude" to location.latitude, "longitude" to location.longitude)
            )
            if (!response.isSuccessful) {
                throw Exception("Failed to update agent location: ${response.errorBody()?.string()}")
            }
        } catch (e: Exception) {
            Log.e(tag, "Error updating agent location for request $requestId", e)
            throw e
        }
    }

    override fun getActiveRequestsStream(): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter { it.status in listOf("Accepted", "In Progress") }
    }

    override fun getPaidRequestsStream(): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter { it.paymentStatus == "Paid" }
    }

    override suspend fun getPaidRequestsInDateRange(startDate: Date, endDate: Date): List<ServiceRequest> {
        return getAllRequests().filter {
            it.paymentStatus == "Paid" &&
            it.paymentTimestamp != null &&
            it.paymentTimestamp.after(startDate) &&
            it.paymentTimestamp.before(endDate)
        }
    }

    override fun getCustomerPaymentHistoryStream(customerId: String): Flow<List<ServiceRequest>> = requestsUpdatesFlow.map {
        getAllRequests().filter {
            it.customerId == customerId &&
            it.paymentStatus == "Paid"
        }
    }
}
