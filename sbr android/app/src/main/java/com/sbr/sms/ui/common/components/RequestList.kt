package com.sbr.sms.ui.common.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest
import java.text.SimpleDateFormat

@Composable
fun RequestList(
    requests: List<ServiceRequest>,
    dateFormatter: SimpleDateFormat,
    navController: NavHostController
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(requests, key = { it.id }) { request ->
            // FIX: This now calls our new, correctly named RequestSummaryCard
            RequestSummaryCard(
                request = request,
                dateFormatter = dateFormatter,
                navController = navController
            )
        }
    }
}