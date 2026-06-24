package com.sbr.sms.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.Agent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentDetailsScreen(
    navController: NavHostController,
    agent: Agent
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agent Details") },
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
                .verticalScroll(rememberScrollState())
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Name: ${agent.name}", style = MaterialTheme.typography.titleLarge)
            Text("Email: ${agent.email}", style = MaterialTheme.typography.bodyLarge)
            Text("Phone: ${agent.phone ?: "N/A"}", style = MaterialTheme.typography.bodyLarge)
            Text("Location: ${agent.location ?: "N/A"}", style = MaterialTheme.typography.bodyLarge)
            Text("Status: ${agent.status}", style = MaterialTheme.typography.bodyLarge)
            Text("Rating: ${agent.rating}", style = MaterialTheme.typography.bodyLarge)
            Text("Completed Jobs: ${agent.completedJobs}", style = MaterialTheme.typography.bodyLarge)

            Spacer(modifier = Modifier.height(24.dp))

            Text("Live Location", style = MaterialTheme.typography.titleMedium)
            Text(
                text = "Lat: ${agent.currentLat ?: "N/A"}, Lng: ${agent.currentLng ?: "N/A"}",
                style = MaterialTheme.typography.bodyLarge
            )

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { /* TODO: Add status toggle or update logic */ },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4B0082)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
            ) {
                Text("Update Agent", color = Color.White)
            }
        }
    }
}
