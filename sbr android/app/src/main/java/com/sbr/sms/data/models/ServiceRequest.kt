package com.sbr.sms.data.models

import android.util.Log
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class ServiceRequest(
    var id: String = "",
    val customerId: String = "",
    var assignedAgentId: String? = null,
    val serviceType: String = "",
    val description: String = "",
    val customerAddress: String = "",
    var status: String = "Pending",
    // NEW: Field to track who created the request. Defaults to "CUSTOMER".
    val createdBy: String = "CUSTOMER",
    @get:ServerTimestamp val createdAt: Timestamp? = null,
    val acceptedAt: Date? = null,
    val completedAt: Date? = null,
    val beforeImageUrl: String? = null,
    val afterImageUrl: String? = null,
    val paymentAmount: Double? = null,
    val paymentStatus: String = "Pending",
    val paymentMethod: String? = null,
    val paymentTimestamp: Date? = null,
    val locationPath: List<AgentLocation> = emptyList()
) {
    companion object {
        fun from(snapshot: DocumentSnapshot): ServiceRequest? {
            return try {
                val locationPathData = snapshot.get("locationPath") as? List<Map<String, Any>> ?: emptyList()
                val locationPath = locationPathData.mapNotNull { map ->
                    AgentLocation(
                        latitude = map["latitude"] as? Double ?: 0.0,
                        longitude = map["longitude"] as? Double ?: 0.0,
                        timestamp = (map["timestamp"] as? Timestamp)?.toDate()
                    )
                }

                ServiceRequest(
                    id = snapshot.id,
                    customerId = snapshot.getString("customerId") ?: "",
                    assignedAgentId = snapshot.getString("assignedAgentId"),
                    serviceType = snapshot.getString("serviceType") ?: "",
                    description = snapshot.getString("description") ?: "",
                    customerAddress = snapshot.getString("customerAddress") ?: "",
                    status = snapshot.getString("status") ?: "Pending",
                    // NEW: Read the createdBy field from the document.
                    createdBy = snapshot.getString("createdBy") ?: "CUSTOMER",
                    createdAt = snapshot.getTimestamp("createdAt"),
                    acceptedAt = snapshot.getTimestamp("acceptedAt")?.toDate(),
                    completedAt = snapshot.getTimestamp("completedAt")?.toDate(),
                    beforeImageUrl = snapshot.getString("beforeImageUrl"),
                    afterImageUrl = snapshot.getString("afterImageUrl"),
                    paymentAmount = snapshot.getDouble("paymentAmount"),
                    paymentStatus = snapshot.getString("paymentStatus") ?: "Pending",
                    paymentMethod = snapshot.getString("paymentMethod"),
                    paymentTimestamp = snapshot.getTimestamp("paymentTimestamp")?.toDate(),
                    locationPath = locationPath
                )
            } catch (e: Exception) {
                Log.e("RequestMapper", "Failed to map document ${snapshot.id}", e)
                null
            }
        }
    }
}