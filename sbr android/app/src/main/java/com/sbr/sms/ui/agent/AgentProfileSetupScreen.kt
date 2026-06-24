package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.agent.viewmodels.AgentProfileSetupViewModel
import com.sbr.sms.ui.agent.viewmodels.SetupNavigationEvent
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentProfileSetupScreen(
    navController: NavHostController,
    viewModel: AgentProfileSetupViewModel = hiltViewModel()
) {
    // Listen for navigation events from the ViewModel
    LaunchedEffect(key1 = true) {
        viewModel.navigationEvent.collectLatest { event ->
            when (event) {
                is SetupNavigationEvent.NavigateToAgentPanel -> {
                    // Navigate to the main agent panel and clear the setup screen from the back stack
                    navController.navigate(AppRoutes.AgentPanel.route) {
                        popUpTo(AppRoutes.AgentProfileSetup.route) { inclusive = true }
                    }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Complete Your Profile") })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "Welcome, Agent!",
                style = MaterialTheme.typography.headlineSmall
            )
            Text(
                "Please provide a few more details to get started.",
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = viewModel.phone,
                onValueChange = { viewModel.phone = it },
                label = { Text("Phone Number") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = viewModel.location,
                onValueChange = { viewModel.location = it },
                label = { Text("Primary Service Location (e.g., City)") },
                modifier = Modifier.fillMaxWidth()
            )

            if (viewModel.isLoading) {
                CircularProgressIndicator()
            }

            viewModel.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Button(
                onClick = { viewModel.onSaveProfileClicked() },
                enabled = !viewModel.isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
            ) {
                Text("Save Profile & Continue")
            }
        }
    }
}