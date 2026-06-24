package com.sbr.sms.ui.customer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.customer.viewmodels.CustomerPaymentsUiState
import com.sbr.sms.ui.customer.viewmodels.CustomerPaymentsViewModel
import com.sbr.sms.ui.customer.viewmodels.CustomerPaymentStats
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerPaymentsScreen(
    navController: NavHostController,
    viewModel: CustomerPaymentsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Payments") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (val state = uiState) {
                is CustomerPaymentsUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is CustomerPaymentsUiState.Error -> {
                    Text(text = state.message, modifier = Modifier.align(Alignment.Center))
                }
                is CustomerPaymentsUiState.Success -> {
                    PaymentsContent(
                        stats = state.stats,
                        paymentHistory = state.paymentHistory,
                        onViewDetails = { requestId ->
                            // Navigate to the detail screen for this specific request
                            navController.navigate(AppRoutes.CustomerRequestDetail.createRoute(requestId))
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentsContent(
    stats: CustomerPaymentStats,
    paymentHistory: List<ServiceRequest>,
    onViewDetails: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SummaryCards(stats = stats)
        }
        item {
            Text(
                "Payment History",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        if (paymentHistory.isEmpty()) {
            item {
                Text(
                    "No payment history found.",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        } else {
            items(paymentHistory, key = { it.id }) { request ->
                PaymentHistoryItem(
                    request = request,
                    onViewDetails = { onViewDetails(request.id) }
                )
            }
        }
    }
}

@Composable
private fun SummaryCards(stats: CustomerPaymentStats) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        InfoCard(
            label = "Total Payments Made",
            value = currencyFormat.format(stats.totalPaymentsMade),
            modifier = Modifier.weight(1f)
        )
        InfoCard(
            label = "Free Services Used",
            value = stats.freeServicesUsed.toString(),
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun InfoCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = label, style = MaterialTheme.typography.labelLarge)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun PaymentHistoryItem(
    request: ServiceRequest,
    onViewDetails: () -> Unit
) {
    val dateFormatter = remember { SimpleDateFormat("dd MMM, yyyy", Locale.getDefault()) }
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }

    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(Icons.Default.CreditCard, contentDescription = "Payment", tint = MaterialTheme.colorScheme.primary)
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = request.serviceType,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = request.paymentTimestamp?.let { dateFormatter.format(it) } ?: "N/A",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = currencyFormat.format(request.paymentAmount ?: 0.0),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Button(onClick = onViewDetails, contentPadding = PaddingValues(horizontal = 12.dp)) {
                    Text("Details")
                }
            }
        }
    }
}