package com.sbr.sms.ui.storeincharge

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.R
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.admin.AdminMultiAgentMapScreen
import com.sbr.sms.ui.admin.AgentManagementScreen
import com.sbr.sms.ui.auth.AuthViewModel
import com.sbr.sms.ui.common.OurCustomersScreen
import com.sbr.sms.ui.common.ProductsCatalogScreen
import kotlinx.coroutines.launch

enum class StoreInchargeSection(val title: String, val icon: ImageVector) {
    Dashboard("Dashboard", Icons.Default.Dashboard),
    Dispatch("Dispatch & Tickets", Icons.AutoMirrored.Filled.List),
    Indents("Van Stock & Indents", Icons.Default.Inventory2),
    CashHandovers("Cash Handovers", Icons.Default.AccountBalanceWallet),
    LiveMap("Live Agent Map", Icons.Default.Map),
    Technicians("Technicians", Icons.Default.Group),
    Products("Store Catalog", Icons.Default.ShoppingCart),
    OurCustomers("Our Customers", Icons.Default.People)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreInchargePanelScreen(
    navController: NavHostController,
    authViewModel: AuthViewModel = hiltViewModel(),
    viewModel: StoreInchargeViewModel = hiltViewModel()
) {
    var selectedSection by remember { mutableStateOf(StoreInchargeSection.Dashboard) }
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .padding(top = 24.dp)
                ) {
                    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                        Text(
                            "Store In-Charge",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            "Operations & Branch Logistics",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                    StoreInchargeSection.values().forEach { section ->
                        NavigationDrawerItem(
                            label = { Text(section.title, fontWeight = FontWeight.Medium) },
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
                    HorizontalDivider()

                    NavigationDrawerItem(
                        label = { Text("Logout", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error) },
                        icon = { Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = MaterialTheme.colorScheme.error) },
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
                    title = {
                        Text(
                            text = selectedSection.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    },
                    navigationIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (selectedSection != StoreInchargeSection.Dashboard) {
                                IconButton(onClick = { selectedSection = StoreInchargeSection.Dashboard }) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Back to Dashboard",
                                        tint = MaterialTheme.colorScheme.onPrimary
                                    )
                                }
                            }
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Menu Drawer",
                                    tint = MaterialTheme.colorScheme.onPrimary
                                )
                            }
                            Image(
                                painter = painterResource(id = R.drawable.sbr_logo),
                                contentDescription = "SBR Logo",
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color.White)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                    },
                    actions = {
                        IconButton(onClick = { authViewModel.logout() }) {
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
                if (selectedSection == StoreInchargeSection.Dashboard || selectedSection == StoreInchargeSection.Dispatch) {
                    FloatingActionButton(
                        onClick = { navController.navigate(AppRoutes.AdminCreateRequest.route) },
                        containerColor = MaterialTheme.colorScheme.primary
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Create Ticket", tint = Color.White)
                    }
                }
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
            ) {
                when (selectedSection) {
                    StoreInchargeSection.Dashboard -> StoreInchargeDashboardScreen(
                        viewModel = viewModel,
                        onNavigateToSection = { section -> selectedSection = section }
                    )
                    StoreInchargeSection.Dispatch -> StoreInchargeDispatchScreen(
                        navController = navController,
                        viewModel = viewModel
                    )
                    StoreInchargeSection.Indents -> StoreInchargeIndentsScreen(
                        viewModel = viewModel
                    )
                    StoreInchargeSection.CashHandovers -> StoreInchargeCashHandoverScreen(
                        viewModel = viewModel
                    )
                    StoreInchargeSection.LiveMap -> AdminMultiAgentMapScreen(
                        navController = navController
                    )
                    StoreInchargeSection.Technicians -> AgentManagementScreen(
                        navController = navController
                    )
                    StoreInchargeSection.Products -> ProductsCatalogScreen(
                        isAdmin = false
                    )
                    StoreInchargeSection.OurCustomers -> OurCustomersScreen(
                        isAdmin = false
                    )
                }
            }
        }
    }
}
