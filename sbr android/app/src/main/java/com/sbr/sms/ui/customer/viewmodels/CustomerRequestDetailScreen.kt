package com.sbr.sms.ui.customer

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerRequestDetailScreen(
    navController: NavHostController,
    request: ServiceRequest
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Request Details") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
        ) {
            Text("Service Type: ${request.serviceType}", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(8.dp))

            Text("Description: ${request.description}")
            Spacer(modifier = Modifier.height(8.dp))

            Text("Address: ${request.customerAddress ?: "N/A"}")
            Spacer(modifier = Modifier.height(8.dp))

            Text("Status: ${request.status}")
            Spacer(modifier = Modifier.height(8.dp))

            // FIXED: Used isNullOrBlank() for a safe check.
            Text("Assigned Agent: ${if (request.assignedAgentId.isNullOrBlank()) "Not Assigned" else request.assignedAgentId}")
            Spacer(modifier = Modifier.height(8.dp))

            Text("Request ID: ${request.id}")
        }
    }
}