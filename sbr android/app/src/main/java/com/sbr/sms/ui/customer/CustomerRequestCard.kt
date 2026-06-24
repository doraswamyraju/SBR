// ui/customer/CustomerRequestCard.kt
package com.sbr.sms.ui.customer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest

@Composable
fun CustomerRequestCard(request: ServiceRequest, navController: NavHostController) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .clickable { navController.navigate("requestDetail/${request.id}") }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(request.serviceType ?: "Unknown", style = MaterialTheme.typography.titleMedium)
            Text("Status: ${request.status ?: "N/A"}")
        }
    }
}
