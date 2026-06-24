package com.sbr.sms.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.User
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.admin.viewmodels.AgentManagementViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentManagementScreen(
    navController: NavHostController,
    viewModel: AgentManagementViewModel = hiltViewModel()
) {
    val agents by viewModel.agents.collectAsState()
    var filterSelection by remember { mutableStateOf("All") }

    val filteredAgents = remember(agents, filterSelection) {
        when (filterSelection) {
            "Active" -> agents.filter { (it as? Agent)?.status == "Active" }
            "Inactive" -> agents.filter { (it as? Agent)?.status == "Inactive" }
            else -> agents
        }
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // --- THE FIX IS HERE ---
            // The "Import Agents" button has been removed. Only the correct "Add Agent" button remains.
            Row(
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Button(onClick = { navController.navigate(AppRoutes.AddAgent.route) }) {
                    Text("Add New Agent")
                }
            }
            // --- END OF FIX ---

            // Filter Chips for agent status
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
            ) {
                FilterChip("All", filterSelection) { filterSelection = "All" }
                FilterChip("Active", filterSelection) { filterSelection = "Active" }
                FilterChip("Inactive", filterSelection) { filterSelection = "Inactive" }
            }

            if (filteredAgents.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No agents found.")
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredAgents, key = { it.id }) { agent ->
                        AgentCard(agent, navController, viewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun FilterChip(
    label: String,
    selected: String,
    onClick: () -> Unit
) {
    ElevatedFilterChip(
        selected = label == selected,
        onClick = onClick,
        label = { Text(label) }
    )
}

@Composable
fun AgentCard(
    user: User,
    navController: NavHostController,
    viewModel: AgentManagementViewModel
) {
    // We only display the card if the user is confirmed to be an Agent
    if (user is Agent) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            navController.currentBackStackEntry?.savedStateHandle?.set("selectedAgent", user)
                            navController.navigate(AppRoutes.AgentDetails.route)
                        }
                ) {
                    Text("Name: ${user.name}", style = MaterialTheme.typography.titleMedium)
                    Text("Phone: ${user.phone ?: "N/A"}", style = MaterialTheme.typography.bodyMedium)
                    Text("Location: ${user.location ?: "Unknown"}", style = MaterialTheme.typography.bodyMedium)
                    Text("Status: ${user.status}", style = MaterialTheme.typography.bodyMedium)
                }
                // Toggle Switch to activate/deactivate the agent
                Switch(
                    checked = user.status == "Active",
                    onCheckedChange = { isChecked ->
                        viewModel.toggleAgentStatus(user, isChecked)
                    }
                )
            }
        }
    }
}
