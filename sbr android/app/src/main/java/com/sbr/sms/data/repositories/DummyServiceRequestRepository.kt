package com.sbr.sms.data.repositories

import com.sbr.sms.data.models.ServiceRequest

object DummyServiceRequestRepository {
    private val requests = mutableListOf<ServiceRequest>()

    fun addRequest(request: ServiceRequest) {
        requests.add(request)
    }

    fun getAllRequests(): List<ServiceRequest> = requests
}
