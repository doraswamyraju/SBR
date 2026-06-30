package com.sbr.sms.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.R
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.admin.viewmodels.AdminDashboardViewModel
import com.sbr.sms.ui.auth.AuthViewModel
import kotlinx.coroutines.launch

enum class AdminSection(val title: String, val icon: ImageVector) {
    Dashboard("Dashboard", Icons.Default.Dashboard),
    Agents("Agents", Icons.Default.Group),
    Customers("Customers", Icons.Default.People),
    Requests("Requests", Icons.Default.List),
    Reports("Reports", Icons.Default.Assessment),
    Payments("Payments", Icons.Default.Payment),
    LiveTracking("All Active Agents", Icons.Default.Map)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminPanelScreen(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    var selectedSection by remember { mutableStateOf(AdminSection.Dashboard) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val dashboardViewModel: AdminDashboardViewModel = hiltViewModel()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .padding(top = 24.dp)
                ) {
                    Text(
                        "Admin Panel",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(16.dp)
                    )
                    HorizontalDivider()
                    AdminSection.values().sortedBy { it.ordinal }.forEach { section ->
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
                            authViewModel.logout()
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (selectedSection != AdminSection.Dashboard) {
                                IconButton(onClick = { selectedSection = AdminSection.Dashboard }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                                }
                            }
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Menu")
                            }
                            androidx.compose.foundation.Image(
                                painter = painterResource(id = R.drawable.sbr_logo),
                                contentDescription = "SBR Logo",
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(6.dp))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                    },
                    actions = {
                        IconButton(onClick = {
                            authViewModel.logout()
                        }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                                contentDescription = "Logout",
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                        titleContentColor = MaterialTheme.colorScheme.onPrimary,
                        navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            },
            floatingActionButton = {
                // The FAB is only shown when the Dashboard is the selected section.
                if (selectedSection == AdminSection.Dashboard) {
                    FloatingActionButton(
                        onClick = { navController.navigate(AppRoutes.AdminCreateRequest.route) }
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Create Service Request")
                    }
                }
            }
        ) { padding ->
            Column(modifier = Modifier.padding(padding)) {
                val onCardClick: (AdminSection) -> Unit = { section ->
                    selectedSection = section
                }

                when (selectedSection) {
                    AdminSection.Dashboard -> AdminDashboardScreen(
                        navController = navController,
                        viewModel = dashboardViewModel,
                        onCardClick = onCardClick
                    )
                    AdminSection.Agents -> AgentManagementScreen(navController)
                    AdminSection.Customers -> CustomerManagementScreen(navController)
                    AdminSection.Requests -> ServiceRequestsScreen(navController)
                    AdminSection.LiveTracking -> AdminMultiAgentMapScreen(navController)
                    AdminSection.Payments -> PaymentsScreen(navController)
                    AdminSection.Reports -> ReportsScreen(navController)
                }
            }
        }
    }
}