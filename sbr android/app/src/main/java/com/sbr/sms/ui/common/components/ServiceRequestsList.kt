package com.sbr.sms.ui.common.components

import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.ui.admin.components.AssignableRequestCard

@Composable
fun ServiceRequestsList(
    requests: List<ServiceRequest>,
    onAssignClick: (requestId: String) -> Unit
) {
    LazyColumn {
        items(requests, key = { it.id }) { request ->
            // FIX: This now calls the correct, specifically named card for this function.
            AssignableRequestCard(
                request = request,
                onAssignClick = { onAssignClick(request.id) }
            )
        }
    }
}