package com.sbr.sms.ui.common.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import java.text.SimpleDateFormat

@Composable
fun RequestSummaryCard(
    request: ServiceRequest,
    dateFormatter: SimpleDateFormat,
    navController: NavHostController
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                // Navigate using the robust route we created
                navController.navigate(AppRoutes.RequestDetail.createRoute(request.id))
            },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(request.serviceType, style = MaterialTheme.typography.titleMedium)
            Text("Status: ${request.status}")
            request.createdAt?.let {
                Text("Created: ${dateFormatter.format(it)}")
            }
        }
    }
}