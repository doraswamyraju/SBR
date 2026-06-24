package com.sbr.sms.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.User

@Composable
fun AssignRequestCard(
    request: ServiceRequest,
    agents: List<User>,
    onAssign: (agentId: String) -> Unit
) {
    var selectedAgentId by remember { mutableStateOf("") }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Request ID: ${request.id}", style = MaterialTheme.typography.titleMedium)
            Text("Service: ${request.serviceType}")
            Text("Customer ID: ${request.customerId}")
            Text("Description: ${request.description}")
            Text("Status: ${request.status}")

            Spacer(Modifier.height(12.dp))

            DropdownMenuWithAgents(
                agents = agents,
                selectedAgentId = selectedAgentId,
                onSelect = { selectedAgentId = it }
            )

            Spacer(Modifier.height(12.dp))

            Button(
                onClick = {
                    if (selectedAgentId.isNotBlank()) {
                        onAssign(selectedAgentId)
                    }
                },
                enabled = selectedAgentId.isNotBlank()
            ) {
                Text("Assign Agent")
            }
        }
    }
}

@Composable
fun DropdownMenuWithAgents(
    agents: List<User>,
    selectedAgentId: String,
    onSelect: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column {
        Text("Select Agent:")
        Box {
            OutlinedButton(onClick = { expanded = true }) {
                Text(
                    agents.find { it.id == selectedAgentId }?.name ?: "Choose Agent"
                )
            }

            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                agents.forEach { agent ->
                    DropdownMenuItem(
                        text = { Text(agent.name) },
                        onClick = {
                            onSelect(agent.id)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}
