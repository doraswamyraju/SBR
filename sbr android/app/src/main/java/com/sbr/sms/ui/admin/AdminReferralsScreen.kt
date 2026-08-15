package com.sbr.sms.ui.admin

import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.api.ReferralClaimDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.ui.admin.viewmodels.AdminReferralViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminReferralsScreen(
    viewModel: AdminReferralViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var activeTab by remember { mutableStateOf("leads") } // "leads" or "claims"
    var editingReferral by remember { mutableStateOf<ReferralDto?>(null) }
    var editingClaim by remember { mutableStateOf<ReferralClaimDto?>(null) }

    LaunchedEffect(uiState.successMsg, uiState.error) {
        val msg = uiState.successMsg ?: uiState.error
        if (msg != null) {
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Tab Selector
        TabRow(selectedTabIndex = if (activeTab == "leads") 0 else 1) {
            Tab(
                selected = activeTab == "leads",
                onClick = { activeTab = "leads" },
                text = { Text("Referral Leads (${uiState.referrals.size})") }
            )
            Tab(
                selected = activeTab == "claims",
                onClick = { activeTab = "claims" },
                text = { Text("Payout Claims (${uiState.claims.size})") }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (activeTab == "leads") {
            if (uiState.referrals.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No referral leads found", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(uiState.referrals) { ref ->
                        AdminReferralLeadCard(
                            ref = ref,
                            onEdit = { editingReferral = ref }
                        )
                    }
                }
            }
        } else {
            if (uiState.claims.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No payout claims found", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(uiState.claims) { claim ->
                        AdminPayoutClaimCard(
                            claim = claim,
                            onEdit = { editingClaim = claim }
                        )
                    }
                }
            }
        }
    }

    if (editingReferral != null) {
        EditReferralStatusDialog(
            ref = editingReferral!!,
            onDismiss = { editingReferral = null },
            onSubmit = { status, purchaseAmount, rewardAmount, notes ->
                viewModel.updateReferralStatus(editingReferral!!.id, status, purchaseAmount, rewardAmount, notes)
                editingReferral = null
            }
        )
    }

    if (editingClaim != null) {
        EditClaimStatusDialog(
            claim = editingClaim!!,
            onDismiss = { editingClaim = null },
            onSubmit = { status, txRef, notes ->
                viewModel.updateClaimStatus(editingClaim!!.id, status, txRef, notes)
                editingClaim = null
            }
        )
    }
}

@Composable
fun AdminReferralLeadCard(ref: ReferralDto, onEdit: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Referee: ${ref.refereeName}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Phone: ${ref.refereePhone}", style = MaterialTheme.typography.bodySmall)
                    Text("Product: ${ref.productName}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                }

                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit Status", tint = MaterialTheme.colorScheme.primary)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Status: ${ref.status}", fontWeight = FontWeight.Bold)
                if (ref.rewardAmount > 0) {
                    Text("Reward: ₹${ref.rewardAmount.toInt()}", color = Color(0xFF059669), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun AdminPayoutClaimCard(claim: ReferralClaimDto, onEdit: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("User: ${claim.userName} (${claim.userPhone})", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Amount: ₹${claim.amount.toInt()}", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    Text("Method: ${claim.payoutMethod} - ${claim.payoutDetails}", style = MaterialTheme.typography.bodySmall)
                }

                IconButton(onClick = onEdit) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit Status", tint = MaterialTheme.colorScheme.primary)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Text("Status: ${claim.status}", fontWeight = FontWeight.Bold)
            if (!claim.transactionRef.isNull_or_blank()) {
                Text("Ref: ${claim.transactionRef}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            }
        }
    }
}

private fun String?.isNull_or_blank() = this.isNullOrBlank()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditReferralStatusDialog(
    ref: ReferralDto,
    onDismiss: () -> Unit,
    onSubmit: (String, Double?, Double?, String?) -> Unit
) {
    var status by remember { mutableStateOf(ref.status) }
    var purchaseAmount by remember { mutableStateOf(ref.purchaseAmount?.toString() ?: "") }
    var rewardAmount by remember { mutableStateOf(ref.rewardAmount.toString()) }
    var notes by remember { mutableStateOf(ref.notes ?: "") }

    val statusOptions = listOf("Pending", "Contacted", "Purchased", "Reward Credited", "Closed / Rejected")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Referral Lead") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Select Lead Status:")
                Column {
                    statusOptions.forEach { opt ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            RadioButton(selected = status == opt, onClick = { status = opt })
                            Text(opt)
                        }
                    }
                }
                OutlinedTextField(
                    value = purchaseAmount,
                    onValueChange = { purchaseAmount = it },
                    label = { Text("Purchase Amount (₹)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = rewardAmount,
                    onValueChange = { rewardAmount = it },
                    label = { Text("Reward Amount (₹)") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Admin Notes") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = {
                onSubmit(
                    status,
                    purchaseAmount.toDoubleOrNull(),
                    rewardAmount.toDoubleOrNull(),
                    notes.ifBlank { null }
                )
            }) {
                Text("Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditClaimStatusDialog(
    claim: ReferralClaimDto,
    onDismiss: () -> Unit,
    onSubmit: (String, String?, String?) -> Unit
) {
    var status by remember { mutableStateOf(if (claim.status == "Pending") "Paid" else claim.status) }
    var txRef by remember { mutableStateOf(claim.transactionRef ?: "") }
    var notes by remember { mutableStateOf(claim.adminNotes ?: "") }

    val claimStatusOptions = listOf("Pending", "Processing", "Paid", "Rejected")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update Payout Claim") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Select Claim Status:")
                Column {
                    claimStatusOptions.forEach { opt ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            RadioButton(selected = status == opt, onClick = { status = opt })
                            Text(opt)
                        }
                    }
                }
                OutlinedTextField(
                    value = txRef,
                    onValueChange = { txRef = it },
                    label = { Text("Transaction Ref / UTR No.") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Admin Notes") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = {
                onSubmit(status, txRef.ifBlank { null }, notes.ifBlank { null })
            }) {
                Text("Save Changes")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
