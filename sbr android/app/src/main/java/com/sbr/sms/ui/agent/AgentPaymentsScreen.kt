package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.agent.viewmodels.AgentPaymentInfo
import com.sbr.sms.ui.agent.viewmodels.AgentPaymentStats
import com.sbr.sms.ui.agent.viewmodels.AgentPaymentsUiState
import com.sbr.sms.ui.agent.viewmodels.AgentPaymentsViewModel
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AgentPaymentsScreen(
    navController: NavHostController,
    viewModel: AgentPaymentsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        when (val state = uiState) {
            is AgentPaymentsUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is AgentPaymentsUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.message)
                }
            }
            is AgentPaymentsUiState.Success -> {
                PaymentsContent(
                    stats = state.stats,
                    transactions = state.transactions,
                    onViewDetails = { requestId ->
                        // Navigate to the generic detail screen, which both admin and agent can view.
                        navController.navigate(AppRoutes.RequestDetail.createRoute(requestId))
                    }
                )
            }
        }
    }
}

@Composable
private fun PaymentsContent(
    stats: AgentPaymentStats,
    transactions: List<AgentPaymentInfo>,
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
                "Collection History",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        if (transactions.isEmpty()) {
            item {
                Text(
                    "No payment collections found.",
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    textAlign = TextAlign.Center
                )
            }
        } else {
            items(transactions, key = { it.request.id }) { transaction ->
                PaymentHistoryItem(
                    paymentInfo = transaction,
                    onViewDetails = { onViewDetails(transaction.request.id) }
                )
            }
        }
    }
}

@Composable
private fun SummaryCards(stats: AgentPaymentStats) {
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        InfoCard(
            label = "Total Collections",
            value = currencyFormat.format(stats.totalCollections),
            icon = Icons.Default.TrendingUp,
            modifier = Modifier.weight(1f)
        )
        InfoCard(
            label = "Today's Collections",
            value = currencyFormat.format(stats.todaysCollections),
            icon = Icons.Default.Today,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun InfoCard(label: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(imageVector = icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = label, style = MaterialTheme.typography.labelLarge)
            Text(text = value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun PaymentHistoryItem(
    paymentInfo: AgentPaymentInfo,
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
                    text = paymentInfo.request.serviceType,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "vs ${paymentInfo.customer?.name ?: "N/A"}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = paymentInfo.request.paymentTimestamp?.let { dateFormatter.format(it) } ?: "N/A",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = currencyFormat.format(paymentInfo.request.paymentAmount ?: 0.0),
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