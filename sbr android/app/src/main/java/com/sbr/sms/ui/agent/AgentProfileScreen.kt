package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.agent.viewmodels.AgentProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentProfileScreen(
    navController: NavHostController,
    viewModel: AgentProfileViewModel = hiltViewModel()
) {
    val agent by viewModel.agentProfile.collectAsState()

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (agent == null) {
                CircularProgressIndicator()
            } else {
                Text(
                    text = "My Profile",
                    style = MaterialTheme.typography.headlineMedium
                )

                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        ListItem(
                            headlineContent = { Text(agent!!.name, fontWeight = FontWeight.Bold) },
                            leadingContent = { Icon(Icons.Default.Person, contentDescription = "Name") },
                            supportingContent = { Text("Name") }
                        )
                        Divider(modifier = Modifier.padding(horizontal = 16.dp))
                        ListItem(
                            headlineContent = { Text(agent!!.email ?: "N/A") },
                            leadingContent = { Icon(Icons.Default.Email, contentDescription = "Email") },
                            supportingContent = { Text("Email") }
                        )
                        Divider(modifier = Modifier.padding(horizontal = 16.dp))
                        ListItem(
                            headlineContent = { Text(agent!!.phone ?: "N/A") },
                            leadingContent = { Icon(Icons.Default.Phone, contentDescription = "Phone") },
                            supportingContent = { Text("Phone") }
                        )
                    }
                }

                OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(vertical = 8.dp)) {
                        ListItem(
                            headlineContent = { Text("${agent!!.completedJobs} Jobs Completed") },
                            leadingContent = { Icon(Icons.Default.Work, contentDescription = "Jobs") }
                        )
                        Divider(modifier = Modifier.padding(horizontal = 16.dp))
                        ListItem(
                            headlineContent = { Text("${agent!!.rating} / 5.0") },
                            leadingContent = { Icon(Icons.Default.Star, contentDescription = "Rating") }
                        )
                        Divider(modifier = Modifier.padding(horizontal = 16.dp))
                        ListItem(
                            headlineContent = { Text(if (agent!!.isAvailable) "Available for new jobs" else "Not available") },
                            trailingContent = {
                                Switch(
                                    checked = agent!!.isAvailable,
                                    onCheckedChange = { isChecked ->
                                        viewModel.updateAvailability(isChecked)
                                    }
                                )
                            }
                        )
                    }
                }

                // FIXED: The onClick now navigates to the correct screen.
                Button(onClick = { navController.navigate(AppRoutes.AgentEditProfile.route) }) {
                    Text("Edit Profile")
                }
            }
        }
    }
}