package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController

@Composable
fun AgentScheduleScreen(navController: NavHostController) {
    val days = (1..7).toList()
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(days) { day ->
            ScheduleDayCard(dayNumber = day)
        }
    }
}

@Composable
private fun ScheduleDayCard(dayNumber: Int) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Day $dayNumber", style = MaterialTheme.typography.titleMedium)
            Text("8:00 AM - 5:00 PM", style = MaterialTheme.typography.bodyMedium)
            Text("5 services scheduled", style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Preview(showBackground = true)
@Composable
fun AgentScheduleScreenPreview() {
    AgentScheduleScreen(navController = rememberNavController())
}
