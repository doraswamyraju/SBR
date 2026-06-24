package com.sbr.sms.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.ui.admin.*
import com.sbr.sms.ui.agent.AgentEditProfileScreen
import com.sbr.sms.ui.agent.AgentPanelScreen
import com.sbr.sms.ui.agent.AgentProfileSetupScreen
import com.sbr.sms.ui.auth.AuthScreen
import com.sbr.sms.ui.auth.AuthState
import com.sbr.sms.ui.auth.AuthViewModel
import com.sbr.sms.ui.customer.CustomerLiveTrackingScreen
import com.sbr.sms.ui.customer.CustomerPanelScreen
import com.sbr.sms.ui.details.CustomerRequestDetailScreen
import com.sbr.sms.ui.details.RequestDetailScreen

sealed class AppRoutes(val route: String) {
    object AuthFlow : AppRoutes("authFlow")
    object AdminPanel : AppRoutes("adminPanel")
    object AgentPanel : AppRoutes("agentPanel")
    object CustomerPanel : AppRoutes("customerPanel")
    object AdminAddEditCustomer : AppRoutes("adminAddEditCustomer?customerId={customerId}") {
        fun createRoute(customerId: String?): String {
            return customerId?.let { "adminAddEditCustomer?customerId=$it" } ?: "adminAddEditCustomer"
        }
    }
    object AdminCreateRequest : AppRoutes("adminCreateRequest")
    object AgentProfileSetup : AppRoutes("agentProfileSetup")
    object AgentEditProfile : AppRoutes("agentEditProfile")
    object AddAgent : AppRoutes("addAgent")
    object AgentDetails : AppRoutes("agentDetails")
    object RequestDetail : AppRoutes("requestDetail/{requestId}") {
        fun createRoute(requestId: String) = "requestDetail/$requestId"
    }
    object CustomerRequestDetail : AppRoutes("customerRequestDetail/{requestId}") {
        fun createRoute(requestId: String) = "customerRequestDetail/$requestId"
    }
    object CustomerLiveTracking : AppRoutes("customerLiveTracking/{requestId}") {
        fun createRoute(requestId: String) = "customerLiveTracking/$requestId"
    }
    object AdminSingleAgentTracking : AppRoutes("adminSingleAgentTracking/{requestId}") {
        fun createRoute(requestId: String) = "adminSingleAgentTracking/$requestId"
    }
    object AdminMultiAgentMap : AppRoutes("adminMultiAgentMap")
}

@Composable
fun AppNavHost() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = AppRoutes.AuthFlow.route
    ) {
        composable(AppRoutes.AuthFlow.route) {
            AuthGate(navController = navController)
        }
        composable("auth_ui_screen") { AuthScreen() }
        composable(AppRoutes.AdminPanel.route) { AdminPanelScreen(navController) }
        composable(AppRoutes.AgentPanel.route) { AgentPanelScreen(navController) }
        composable(AppRoutes.CustomerPanel.route) { CustomerPanelScreen(navController) }
        composable(
            route = AppRoutes.AdminAddEditCustomer.route,
            arguments = listOf(navArgument("customerId") {
                type = NavType.StringType
                nullable = true
            })
        ) {
            AddEditCustomerScreen(navController)
        }
        composable(AppRoutes.AdminCreateRequest.route) { AdminCreateRequestScreen(navController) }
        composable(AppRoutes.AgentProfileSetup.route) { AgentProfileSetupScreen(navController) }
        composable(AppRoutes.AgentEditProfile.route) { AgentEditProfileScreen(navController) }
        composable(AppRoutes.AddAgent.route) { AddAgentScreen(navController = navController) }
        composable(AppRoutes.AgentDetails.route) {
            val agent = navController.previousBackStackEntry?.savedStateHandle?.get<Agent>("selectedAgent")
            if (agent != null) { AgentDetailsScreen(navController = navController, agent = agent)
            } else { Text("Error: Could not load agent details.") }
        }
        composable(
            route = AppRoutes.RequestDetail.route,
            arguments = listOf(navArgument("requestId") { type = NavType.StringType })
        ) {
            val requestId = it.arguments?.getString("requestId")
            if (requestId != null) { RequestDetailScreen(requestId = requestId, navController = navController) }
        }
        composable(
            route = AppRoutes.CustomerRequestDetail.route,
            arguments = listOf(navArgument("requestId") { type = NavType.StringType })
        ) {
            val requestId = it.arguments?.getString("requestId")
            if (requestId != null) { CustomerRequestDetailScreen(requestId = requestId, navController = navController) }
        }
        composable(
            route = AppRoutes.CustomerLiveTracking.route,
            arguments = listOf(navArgument("requestId") { type = NavType.StringType })
        ) { CustomerLiveTrackingScreen(navController = navController) }
        composable(
            route = AppRoutes.AdminSingleAgentTracking.route,
            arguments = listOf(navArgument("requestId") { type = NavType.StringType })
        ) { LiveTrackingScreen(navController = navController) }
        composable(AppRoutes.AdminMultiAgentMap.route) { AdminMultiAgentMapScreen(navController = navController) }
    }
}

@Composable
fun AuthGate(
    navController: NavHostController,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()

    when (val state = authState) {
        is AuthState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is AuthState.Unauthenticated -> {
            AuthScreen(viewModel = viewModel)
        }
        is AuthState.Authenticated -> {
            // FIX: Use stable user ID to ensure navigation runs once when the user is fully authenticated.
            LaunchedEffect(state.user.id) {
                val user = state.user

                val destination = if (user.role == UserRole.AGENT && (user as? Agent)?.phone.isNullOrEmpty()) {
                    AppRoutes.AgentProfileSetup.route
                } else {
                    when (user.role) {
                        UserRole.ADMIN -> AppRoutes.AdminPanel.route
                        UserRole.AGENT -> AppRoutes.AgentPanel.route
                        UserRole.CUSTOMER -> AppRoutes.CustomerPanel.route
                    }
                }

                navController.navigate(destination) {
                    popUpTo(AppRoutes.AuthFlow.route) { inclusive = true }
                }
            }
        }
    }
}
