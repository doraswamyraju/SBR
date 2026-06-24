package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.agent.viewmodels.AgentRequestsViewModel
import com.sbr.sms.ui.common.RequestLocationPermission
import kotlinx.coroutines.launch

enum class AgentSection(val title: String, val icon: ImageVector) {
    Dashboard("Dashboard", Icons.Default.Dashboard),
    NewRequests("New Requests", Icons.AutoMirrored.Filled.List),
    ActiveService("Active Service", Icons.Default.Construction),
    Payments("Payments", Icons.Default.Payment),
    Profile("My Profile", Icons.Default.Person)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentPanelScreen(
    navController: NavHostController,
    viewModel: AgentRequestsViewModel = hiltViewModel()
) {
    var selectedSection by remember { mutableStateOf(AgentSection.Dashboard) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    RequestLocationPermission {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet {
                    Column(Modifier.fillMaxHeight().padding(top = 24.dp)) {
                        Text("Agent Panel", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(16.dp))
                        Divider()
                        AgentSection.values().forEach { section ->
                            NavigationDrawerItem(
                                label = { Text(section.title) },
                                icon = { Icon(section.icon, contentDescription = section.title) },
                                selected = section == selectedSection,
                                onClick = {
                                    selectedSection = section
                                    scope.launch { drawerState.close() }
                                },
                                modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                            )
                        }
                        Spacer(Modifier.weight(1f))
                        NavigationDrawerItem(
                            label = { Text("Logout") },
                            icon = { Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout") },
                            selected = false,
                            onClick = {
                                viewModel.logout()
                                navController.navigate(AppRoutes.AuthFlow.route) {
                                    popUpTo(AppRoutes.AgentPanel.route) { inclusive = true }
                                }
                            },
                            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                        )
                    }
                }
            }
        ) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text(selectedSection.title) },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Menu")
                            }
                        },
                        actions = {
                            IconButton(onClick = {
                                viewModel.logout()
                                navController.navigate(AppRoutes.AuthFlow.route) {
                                    popUpTo(AppRoutes.AgentPanel.route) { inclusive = true }
                                }
                            }) {
                                Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = MaterialTheme.colorScheme.onPrimary)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            titleContentColor = MaterialTheme.colorScheme.onPrimary,
                            navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    )
                }
            ) { padding ->
                AgentLocationUpdater(viewModel = viewModel)
                Box(Modifier.padding(padding).fillMaxSize()) {
                    when (selectedSection) {
                        AgentSection.Dashboard -> AgentDashboardScreen(
                            viewModel = viewModel,
                            onNavigateToSection = { section -> selectedSection = section }
                        )
                        AgentSection.NewRequests -> AgentRequestsScreen(navController = navController, viewModel = viewModel)
                        AgentSection.ActiveService -> AgentActiveRequestsScreen(viewModel = viewModel)
                        AgentSection.Payments -> AgentPaymentsScreen(navController = navController)
                        AgentSection.Profile -> AgentProfileScreen(navController = navController)
                    }
                }
            }
        }
    }
}