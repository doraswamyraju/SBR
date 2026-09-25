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
import androidx.compose.ui.unit.sp
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
                val activeFilter by viewModel.selectedFilter.collectAsState()
                PaymentsContent(
                    stats = state.stats,
                    transactions = state.transactions,
                    activeFilter = activeFilter,
                    onFilterSelect = { viewModel.setDateFilter(it) },
                    onViewDetails = { requestId ->
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
    activeFilter: com.sbr.sms.ui.agent.viewmodels.PaymentDateFilter,
    onFilterSelect: (com.sbr.sms.ui.agent.viewmodels.PaymentDateFilter) -> Unit,
    onViewDetails: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Date Filter Row
        item {
            androidx.compose.foundation.lazy.LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(com.sbr.sms.ui.agent.viewmodels.PaymentDateFilter.values()) { flt ->
                    FilterChip(
                        selected = activeFilter == flt,
                        onClick = { onFilterSelect(flt) },
                        label = { Text(flt.label) }
                    )
                }
            }
        }

        // Executive KPI Summary 2x2 Cards
        item {
            SummaryCards(stats = stats)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Collection History (${activeFilter.label})",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text("${transactions.size} records", color = androidx.compose.ui.graphics.Color.Gray, fontSize = 12.sp)
            }
        }

        if (transactions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Box(modifier = Modifier.padding(32.dp).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("No payment collections found for '${activeFilter.label}'.", textAlign = TextAlign.Center, color = androidx.compose.ui.graphics.Color.Gray)
                    }
                }
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
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            InfoCard(
                label = "Selected Filter Total",
                value = currencyFormat.format(stats.filteredCollections),
                icon = Icons.Default.TrendingUp,
                iconBg = androidx.compose.ui.graphics.Color(0xFFE0F2FE),
                iconTint = androidx.compose.ui.graphics.Color(0xFF0284C7),
                modifier = Modifier.weight(1f)
            )
            InfoCard(
                label = "Today's Collections",
                value = currencyFormat.format(stats.todaysCollections),
                icon = Icons.Default.Today,
                iconBg = androidx.compose.ui.graphics.Color(0xFFFEF3C7),
                iconTint = androidx.compose.ui.graphics.Color(0xFFD97706),
                modifier = Modifier.weight(1f)
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            InfoCard(
                label = "Settled Handovers",
                value = currencyFormat.format(stats.settledHandovers),
                icon = Icons.Default.CreditCard,
                iconBg = androidx.compose.ui.graphics.Color(0xFFDCFCE7),
                iconTint = androidx.compose.ui.graphics.Color(0xFF16A34A),
                modifier = Modifier.weight(1f)
            )
            InfoCard(
                label = "Pending EOD Cash",
                value = currencyFormat.format(stats.pendingEodCash),
                icon = Icons.Default.CreditCard,
                iconBg = androidx.compose.ui.graphics.Color(0xFFFFEDD5),
                iconTint = androidx.compose.ui.graphics.Color(0xFFEA580C),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun InfoCard(
    label: String,
    value: String,
    icon: ImageVector,
    iconBg: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.primaryContainer,
    iconTint: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.primary,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Surface(
                color = iconBg,
                shape = androidx.compose.foundation.shape.CircleShape,
                modifier = Modifier.size(32.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = icon, contentDescription = label, tint = iconTint, modifier = Modifier.size(18.dp))
                }
            }
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = androidx.compose.ui.graphics.Color.Gray)
            Text(text = value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
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