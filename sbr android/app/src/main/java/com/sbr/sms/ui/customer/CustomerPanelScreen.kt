package com.sbr.sms.ui.customer

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.auth.AuthViewModel
import kotlinx.coroutines.launch

import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import com.sbr.sms.R

enum class CustomerSection(val title: String) {
    Dashboard("Dashboard"),
    Requests("My Requests"),
    Payments("Payments"),
    Support("Contact Support"),
    Profile("My Profile")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerPanelScreen(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel()
) {
    var selectedSection by remember { mutableStateOf(CustomerSection.Dashboard) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var showNewRequestDialog by remember { mutableStateOf(false) }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(Modifier.fillMaxHeight().padding(top = 24.dp)) {
                    Text("Customer Panel", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(16.dp))
                    HorizontalDivider()
                    CustomerSection.values().forEach { section ->
                        NavigationDrawerItem(
                            label = { Text(section.title) },
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
                            if (selectedSection != CustomerSection.Dashboard) {
                                IconButton(onClick = { selectedSection = CustomerSection.Dashboard }) {
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
                FloatingActionButton(onClick = { showNewRequestDialog = true }) {
                    Icon(Icons.Default.Add, contentDescription = "New Request")
                }
            }
        ) { padding ->
            Box(Modifier.padding(padding).fillMaxSize()) {
                when (selectedSection) {
                    CustomerSection.Dashboard -> CustomerDashboardScreen(
                        showDialog = showNewRequestDialog,
                        onShowDialogChange = { showNewRequestDialog = it },
                        onNavigateToSection = { newSection -> selectedSection = newSection },
                        onNavigate = { route ->
                            navController.navigate(route)
                        }
                    )
                    CustomerSection.Requests -> CustomerRequestsScreen(navController)
                    CustomerSection.Profile -> CustomerProfileScreen(navController)
                    CustomerSection.Payments -> CustomerPaymentsScreen(navController)
                    CustomerSection.Support -> CustomerSupportScreen(navController)
                }
            }
        }
    }
}