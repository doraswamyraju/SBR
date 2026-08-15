package com.sbr.sms.ui.customer

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.ui.customer.viewmodels.ReferralViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReferAndEarnScreen(
    viewModel: ReferralViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    var showSubmitDialog by remember { mutableStateOf(false) }
    var showClaimDialog by remember { mutableStateOf(false) }

    val dashboard = uiState.dashboard

    LaunchedEffect(uiState.referralSuccessMsg, uiState.claimSuccessMsg, uiState.referralErrorMsg, uiState.claimErrorMsg) {
        val msg = uiState.referralSuccessMsg ?: uiState.claimSuccessMsg ?: uiState.referralErrorMsg ?: uiState.claimErrorMsg
        if (msg != null) {
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
        }
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showSubmitDialog = true },
                icon = { Icon(Icons.Default.PersonAdd, contentDescription = "Refer Friend") },
                text = { Text("Refer a Friend") },
                containerColor = MaterialTheme.colorScheme.primary
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Banner
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.CardGiftcard,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(32.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        "Refer Friends & Earn Cash Rewards!",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "Share your code, earn rewards when your friends purchase SBR products.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Referral Code Display
                            val code = dashboard?.referralCode ?: "SBR-EARN"
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("YOUR REFERRAL CODE", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                                    Text(code, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp)
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    IconButton(onClick = {
                                        clipboardManager.setText(AnnotatedString(code))
                                        Toast.makeText(context, "Code copied to clipboard!", Toast.LENGTH_SHORT).show()
                                    }) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy Code")
                                    }

                                    Button(
                                        onClick = {
                                            val shareText = "Hey! Use my referral code *$code* when booking solar panels or water systems with Sri Balaji Renewables (SBR) to get special discounts! https://sbr.sridcha.com"
                                            val intent = Intent(Intent.ACTION_SEND).apply {
                                                type = "text/plain"
                                                putExtra(Intent.EXTRA_TEXT, shareText)
                                                setPackage("com.whatsapp")
                                            }
                                            try {
                                                context.startActivity(intent)
                                            } catch (e: Exception) {
                                                val genericIntent = Intent(Intent.ACTION_SEND).apply {
                                                    type = "text/plain"
                                                    putExtra(Intent.EXTRA_TEXT, shareText)
                                                }
                                                context.startActivity(Intent.createChooser(genericIntent, "Share Referral Code"))
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))
                                    ) {
                                        Icon(Icons.Default.Share, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Share", color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }

                // Stats Overview Grid
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard("Invited", "${dashboard?.totalInvited ?: 0}", Icons.Default.Group, Modifier.weight(1f))
                        StatCard("Converted", "${dashboard?.convertedCount ?: 0}", Icons.Default.CheckCircle, Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard("Total Earned", "₹${(dashboard?.totalEarnings ?: 0.0).toInt()}", Icons.Default.Payments, Modifier.weight(1f), isHighlight = true)
                        StatCard("Available", "₹${(dashboard?.availableBalance ?: 0.0).toInt()}", Icons.Default.AccountBalanceWallet, Modifier.weight(1f), isHighlight = true)
                    }
                }

                // Claim Payout Banner
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Payout Balance", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text(
                                    "Minimum payout request is ₹500 via UPI or Bank Transfer.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Button(
                                onClick = { showClaimDialog = true }
                            ) {
                                Text("Claim Payout")
                            }
                        }
                    }
                }

                // Submitted Referrals List Section Header
                item {
                    Text(
                        "Your Submitted Referrals",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                val referrals = dashboard?.referrals ?: emptyList()
                if (referrals.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No referral leads submitted yet. Click 'Refer a Friend' to get started!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.Gray
                            )
                        }
                    }
                } else {
                    items(referrals) { ref ->
                        ReferralLeadItemCard(ref)
                    }
                }
            }
        }
    }

    if (showSubmitDialog) {
        SubmitReferralDialog(
            products = uiState.products,
            onDismiss = { showSubmitDialog = false },
            onSubmit = { name, phone, prodId, prodName, notes ->
                viewModel.submitReferral(name, phone, prodId, prodName, notes)
                showSubmitDialog = false
            }
        )
    }

    if (showClaimDialog) {
        ClaimPayoutDialog(
            availableBalance = dashboard?.availableBalance ?: 0.0,
            onDismiss = { showClaimDialog = false },
            onSubmit = { amount, method, details ->
                viewModel.claimPayout(amount, method, details)
                showClaimDialog = false
            }
        )
    }
}

@Composable
fun StatCard(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    isHighlight: Boolean = false
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isHighlight) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(label, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
                Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ReferralLeadItemCard(ref: ReferralDto) {
    val statusColor = when (ref.status) {
        "Purchased", "Reward Credited" -> Color(0xFF059669)
        "Contacted" -> Color(0xFFD97706)
        else -> Color(0xFF2563EB)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(ref.refereeName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("Phone: ${ref.refereePhone}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                Text("Product: ${ref.productName}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium)
            }

            Column(horizontalAlignment = Alignment.End) {
                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        ref.status,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = statusColor,
                        fontWeight = FontWeight.Bold
                    )
                }

                if (ref.rewardAmount > 0) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "+₹${ref.rewardAmount.toInt()}",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF059669)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubmitReferralDialog(
    products: List<ProductDto>,
    onDismiss: () -> Unit,
    onSubmit: (String, String, String?, String, String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var selectedProduct by remember { mutableStateOf<ProductDto?>(products.firstOrNull()) }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Refer a Friend") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Friend's Full Name *") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Friend's Phone Number *") },
                    modifier = Modifier.fillMaxWidth()
                )
                Text("Interested Product / Service:", style = MaterialTheme.typography.labelMedium)
                LazyColumn(modifier = Modifier.heightIn(max = 120.dp)) {
                    items(products) { prod ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedProduct = prod }
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedProduct?.id == prod.id,
                                onClick = { selectedProduct = prod }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(prod.name, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes / Requirements (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && phone.isNotBlank() && selectedProduct != null) {
                        onSubmit(name, phone, selectedProduct!!.id, selectedProduct!!.name, notes.ifBlank { null })
                    }
                },
                enabled = name.isNotBlank() && phone.isNotBlank() && selectedProduct != null
            ) {
                Text("Submit Referral")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun ClaimPayoutDialog(
    availableBalance: Double,
    onDismiss: () -> Unit,
    onSubmit: (Double, String, String) -> Unit
) {
    var amount by remember { mutableStateOf(if (availableBalance >= 500) "500" else "") }
    var selectedMethod by remember { mutableStateOf("UPI") }
    var details by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Claim Payout Request") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Available Balance: ₹${availableBalance.toInt()}", fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Payout Amount (Min ₹500)") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = selectedMethod == "UPI", onClick = { selectedMethod = "UPI" })
                        Text("UPI")
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(selected = selectedMethod == "Bank Transfer", onClick = { selectedMethod = "Bank Transfer" })
                        Text("Bank Transfer")
                    }
                }
                OutlinedTextField(
                    value = details,
                    onValueChange = { details = it },
                    label = { Text(if (selectedMethod == "UPI") "UPI ID (e.g. 9876543210@ybl)" else "Bank Name, A/C No, IFSC Code") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            val amtVal = amount.toDoubleOrNull() ?: 0.0
            Button(
                onClick = {
                    if (amtVal >= 500 && details.isNotBlank()) {
                        onSubmit(amtVal, selectedMethod, details)
                    }
                },
                enabled = amtVal >= 500 && amtVal <= availableBalance && details.isNotBlank()
            ) {
                Text("Request Payout")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
