package com.sbr.sms.ui.admin

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.admin.viewmodels.AdminPaymentsUiState
import com.sbr.sms.ui.admin.viewmodels.AdminPaymentsViewModel
import com.sbr.sms.ui.admin.viewmodels.PaymentInfo
import com.sbr.sms.ui.admin.viewmodels.PaymentStats
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentsScreen(
    navController: NavHostController,
    viewModel: AdminPaymentsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedPayment by remember { mutableStateOf<PaymentInfo?>(null) }
    var showExportDialog by remember { mutableStateOf(false) }

    if (selectedPayment != null) {
        TransactionDetailDialog(
            paymentInfo = selectedPayment!!,
            onDismiss = { selectedPayment = null }
        )
    }

    if (showExportDialog) {
        ExportDialog(
            onDismiss = { showExportDialog = false },
            onExport = { startDate, endDate ->
                showExportDialog = false
                scope.launch {
                    viewModel.exportTransactions(startDate, endDate) { success, message ->
                        Toast.makeText(context, message, Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Payments & Revenue") },
                actions = {
                    IconButton(onClick = { showExportDialog = true }) {
                        Icon(Icons.Default.Download, contentDescription = "Export Data")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (val state = uiState) {
                is AdminPaymentsUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is AdminPaymentsUiState.Error -> {
                    Text(text = state.message, modifier = Modifier.align(Alignment.Center))
                }
                is AdminPaymentsUiState.Success -> {
                    PaymentsContent(
                        stats = state.stats,
                        transactions = state.transactions,
                        onViewClick = { paymentInfo ->
                            selectedPayment = paymentInfo
                        },
                        onEditClick = {
                            Toast.makeText(context, "Edit feature coming soon!", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun PaymentsContent(
    stats: PaymentStats,
    transactions: List<PaymentInfo>,
    onViewClick: (PaymentInfo) -> Unit,
    onEditClick: (PaymentInfo) -> Unit
) {
    // ... This function is unchanged ...
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SummaryCards(stats = stats)
        }
        item {
            Text(
                "Transaction History",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }
        if (transactions.isEmpty()) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    Text("No payment transactions found.")
                }
            }
        } else {
            items(transactions, key = { it.request.id }) { transaction ->
                PaymentListItem(
                    paymentInfo = transaction,
                    onViewClick = { onViewClick(transaction) },
                    onEditClick = { onEditClick(transaction) }
                )
            }
        }
    }
}

@Composable
private fun SummaryCards(stats: PaymentStats) {
    // ... This function is unchanged ...
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        InfoCard(
            label = "Total Revenue",
            value = currencyFormat.format(stats.totalRevenue),
            icon = Icons.Default.TrendingUp,
            color = MaterialTheme.colorScheme.primaryContainer
        )
        InfoCard(
            label = "Today's Collections",
            value = currencyFormat.format(stats.todaysCollections),
            icon = Icons.Default.Today,
            color = MaterialTheme.colorScheme.secondaryContainer
        )
    }
}

@Composable
private fun InfoCard(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: androidx.compose.ui.graphics.Color) {
    // ... This function is unchanged ...
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = color),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = icon, contentDescription = label, modifier = Modifier.size(40.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = label, style = MaterialTheme.typography.labelLarge)
                Text(text = value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun PaymentListItem(
    paymentInfo: PaymentInfo,
    onViewClick: () -> Unit,
    onEditClick: () -> Unit
) {
    // ... This function is unchanged ...
    val dateFormatter = remember { SimpleDateFormat("dd MMM, yyyy", Locale.getDefault()) }
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = paymentInfo.agent?.name ?: "N/A",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Date: ${paymentInfo.request.paymentTimestamp?.let { dateFormatter.format(it) } ?: "N/A"}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Text(
                    text = currencyFormat.format(paymentInfo.request.paymentAmount ?: 0.0),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.align(Alignment.End)
            ) {
                OutlinedButton(onClick = onEditClick) {
                    Text("Edit")
                }
                Button(onClick = onViewClick) {
                    Text("View")
                }
            }
        }
    }
}

@Composable
private fun TransactionDetailDialog(
    paymentInfo: PaymentInfo,
    onDismiss: () -> Unit
) {
    // ... This function is unchanged ...
    val dateFormatter = remember { SimpleDateFormat("dd MMM yyyy, HH:mm a", Locale.getDefault()) }
    val currencyFormat = remember { NumberFormat.getCurrencyInstance(Locale("en", "IN")) }
    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(16.dp)) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Transaction Details", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                DetailRow(label = "Transaction ID", value = paymentInfo.request.id)
                Divider()
                DetailRow(label = "Agent Name", value = paymentInfo.agent?.name ?: "N/A")
                Divider()
                DetailRow(label = "Customer Name", value = paymentInfo.customer?.name ?: "N/A")
                Divider()
                DetailRow(label = "Date & Time", value = paymentInfo.request.paymentTimestamp?.let { dateFormatter.format(it) } ?: "N/A")
                Divider()
                DetailRow(label = "Payment Method", value = paymentInfo.request.paymentMethod ?: "N/A")
                Divider()
                DetailRow(label = "Amount", value = currencyFormat.format(paymentInfo.request.paymentAmount ?: 0.0), isValueBold = true)
                Spacer(modifier = Modifier.height(8.dp))
                Button(onClick = onDismiss, modifier = Modifier.align(Alignment.End)) {
                    Text("Close")
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String, isValueBold: Boolean = false) {
    // ... This function is unchanged ...
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (isValueBold) FontWeight.Bold else FontWeight.Normal,
            modifier = Modifier.weight(1f)
        )
    }
}

// FIXED: This function is now correctly placed at the top-level of the file.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExportDialog(
    onDismiss: () -> Unit,
    onExport: (Date, Date) -> Unit
) {
    var fromDate by remember { mutableStateOf<Long?>(null) }
    var toDate by remember { mutableStateOf<Long?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }
    var isPickingFromDate by remember { mutableStateOf(true) }

    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis()
    )
    val dateFormatter = remember { SimpleDateFormat("dd MMM, yyyy", Locale.getDefault()) }

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDatePicker = false
                        datePickerState.selectedDateMillis?.let {
                            if (isPickingFromDate) {
                                fromDate = it
                            } else {
                                toDate = it
                            }
                        }
                    }
                ) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(16.dp)) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Select Date Range", style = MaterialTheme.typography.headlineSmall)
                Spacer(modifier = Modifier.height(24.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    OutlinedButton(
                        onClick = { isPickingFromDate = true; showDatePicker = true },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(fromDate?.let { dateFormatter.format(Date(it)) } ?: "From Date")
                    }
                    OutlinedButton(
                        onClick = { isPickingFromDate = false; showDatePicker = true },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(toDate?.let { dateFormatter.format(Date(it)) } ?: "To Date")
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = { onExport(Date(fromDate!!), Date(toDate!!)) },
                    enabled = fromDate != null && toDate != null
                ) {
                    Text("Download CSV")
                }
            }
        }
    }
}