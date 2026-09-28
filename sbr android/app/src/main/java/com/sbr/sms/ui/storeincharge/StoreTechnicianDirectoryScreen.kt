package com.sbr.sms.ui.storeincharge

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.models.Agent
import com.sbr.sms.ui.admin.viewmodels.AgentManagementViewModel
import com.sbr.sms.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreTechnicianDirectoryScreen(
    viewModel: AgentManagementViewModel = hiltViewModel()
) {
    val agents by viewModel.agents.collectAsState()
    val context = LocalContext.current

    var searchQuery by remember { mutableStateOf("") }
    var filterSelection by remember { mutableStateOf("All") }

    val filteredAgents = remember(agents, searchQuery, filterSelection) {
        agents.mapNotNull { it as? Agent }.filter { agent ->
            val matchesFilter = when (filterSelection) {
                "Active" -> agent.status == "Active"
                "Inactive" -> agent.status != "Active"
                else -> true
            }
            val matchesSearch = searchQuery.isBlank() ||
                    agent.name.contains(searchQuery, ignoreCase = true) ||
                    (agent.phone?.contains(searchQuery, ignoreCase = true) == true) ||
                    (agent.specialization?.contains(searchQuery, ignoreCase = true) == true)

            matchesFilter && matchesSearch
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search technician by name, phone, or skill...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        )

        // Filter Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("All", "Active", "Inactive").forEach { filter ->
                FilterChip(
                    selected = filterSelection == filter,
                    onClick = { filterSelection = filter },
                    label = { Text(filter) }
                )
            }
        }

        if (filteredAgents.isEmpty()) {
            EmptyState(message = "No technicians found matching criteria.")
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredAgents, key = { it.id }) { agent ->
                    TechnicianDirectoryCard(
                        agent = agent,
                        onCallTechnician = {
                            if (!agent.phone.isNullOrBlank()) {
                                try {
                                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${agent.phone}")).apply {
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    }
                                    context.startActivity(dialIntent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Could not open phone dialer", Toast.LENGTH_SHORT).show()
                                }
                            } else {
                                Toast.makeText(context, "No phone number available for ${agent.name}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun TechnicianDirectoryCard(
    agent: Agent,
    onCallTechnician: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = agent.name.take(1).uppercase(),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Details
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = agent.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (agent.status == "Active") Color(0xFFDCFCE7) else Color(0xFFFEE2E2)
                    ) {
                        Text(
                            text = agent.status,
                            color = if (agent.status == "Active") Color(0xFF15803D) else Color(0xFFB91C1C),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                if (!agent.phone.isNullOrBlank()) {
                    Text(
                        text = agent.phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.DarkGray
                    )
                }

                if (!agent.specialization.isNullOrBlank()) {
                    Text(
                        text = "Expertise: ${agent.specialization}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                if (!agent.location.isNullOrBlank()) {
                    Text(
                        text = "Base: ${agent.location}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                }
            }

            // Quick Contact Action
            IconButton(
                onClick = onCallTechnician,
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE0F2FE))
            ) {
                Icon(
                    Icons.Default.Phone,
                    contentDescription = "Call Technician",
                    tint = Color(0xFF0284C7)
                )
            }
        }
    }
}
