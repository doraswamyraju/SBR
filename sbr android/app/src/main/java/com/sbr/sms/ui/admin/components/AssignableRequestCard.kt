package com.sbr.sms.ui.admin.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.sbr.sms.data.models.ServiceRequest

@Composable
fun AssignableRequestCard(
    request: ServiceRequest,
    onAssignClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(modifier = modifier.padding(8.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = "Service: ${request.serviceType}")
            Text(text = "Status: ${request.status}")
            Button(onClick = onAssignClick) {
                Text("Assign Agent")
            }
        }
    }
}