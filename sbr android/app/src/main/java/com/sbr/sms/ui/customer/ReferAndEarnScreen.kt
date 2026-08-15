package com.sbr.sms.ui.customer

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Share
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
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ReferralClaimDto
import com.sbr.sms.data.api.ReferralDto
import com.sbr.sms.ui.customer.viewmodels.ReferralUiState
import com.sbr.sms.ui.customer.viewmodels.ReferralViewModel
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun ReferAndEarnScreen(
    viewModel: ReferralViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    var showReferDialog by remember { mutableStateOf(false) }
    var showClaimDialog by remember { mutableStateOf(false) }

    // Display messages if any
    LaunchedEffect(uiState.referralSuccessMsg) {
        uiState.referralSuccessMsg?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
            showReferDialog = false
        }
    }
    LaunchedEffect(uiState.claimSuccessMsg) {
        uiState.claimSuccessMsg?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
            showClaimDialog = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        if (uiState.isLoading && uiState.dashboard == null) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
        } else {
            val dashboard = uiState.dashboard
            if (dashboard != null) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Referral Code Card
                    item {
                        ReferralCodeCard(
                            referralCode = dashboard.referralCode,
                            onCopy = {
                                clipboardManager.setText(AnnotatedString(dashboard.referralCode))
                                Toast.makeText(context, "Referral Code Copied!", Toast.LENGTH_SHORT).show()
                            },
                            onShare = {
                                val message = "Hey! Check out Sri Balaji Renewables for high-efficiency solar water heaters, solar power systems & water softeners in Tirupati! Use my referral code *${dashboard.referralCode}* when ordering to get special partner support. Visit: https://sbr.sriddha.com"
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, message)
                                    type = "text/plain"
                                    `package` = "com.whatsapp"
                                }
                                try {
                                    context.startActivity(sendIntent)
                                } catch (e: Exception) {
                                    val genericIntent = Intent().apply {
                                        action = Intent.ACTION_SEND
                                        putExtra(Intent.EXTRA_TEXT, message)
                                        type = "text/plain"
                                    }
                                    context.startActivity(Intent.createChooser(genericIntent, "Share Referral Link"))
                                }
                            }
                        )
                    }

                    // Stats Grid
                    item {
                        StatsSection(
                            invited = dashboard.totalInvited,
                            converted = dashboard.convertedCount,
                            balance = dashboard.availableBalance,
                            pending = dashboard.pendingEarnings
                        )
                    }

                    // Action Buttons Row
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { showReferDialog = true },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Refer a Friend", fontWeight = FontWeight.Bold)
                            }
                            
                            Button(
                                onClick = { showClaimDialog = true },
                                modifier = Modifier.weight(1f),
                                enabled = dashboard.availableBalance >= 500,
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Text("Request Payout", fontWeight = FontWeight.Bold)
                            }
                        }
                        if (dashboard.availableBalance < 500) {
                            Text(
                                text = "* Minimum Payout claim is ₹500",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.outline,
                                modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                            )
                        }
                    }

                    // History Section (Tabs / Switcher)
                    item {
                        ReferralHistoryTabs(
                            referrals = dashboard.referrals,
                            claims = dashboard.claims
                        )
                    }
                }
            } else if (uiState.error != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(uiState.error ?: "Error occurred", color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadData() }) {
                        Text("Retry")
                    }
                }
            }
        }

        // Dialog for Referring a Friend
        if (showReferDialog) {
            ReferFriendDialog(
                products = uiState.products,
                isSubmitting = uiState.isSubmittingReferral,
                errorMsg = uiState.referralErrorMsg,
                onSubmit = { name, phone, product ->
                    viewModel.submitReferral(name, phone, product.id, product.name, "")
                },
                onDismiss = {
                    viewModel.clearMessages()
                    showReferDialog = false
                }
            )
        }

        // Dialog for Claiming Payout
        if (showClaimDialog) {
            ClaimPayoutDialog(
                availableBalance = uiState.dashboard?.availableBalance ?: 0.0,
                isSubmitting = uiState.isSubmittingClaim,
                errorMsg = uiState.claimErrorMsg,
                onSubmit = { amount, method, details ->
                    viewModel.claimPayout(amount, method, details)
                },
                onDismiss = {
                    viewModel.clearMessages()
                    showClaimDialog = false
                }
            )
        }
    }
}

@Composable
fun ReferralCodeCard(
    referralCode: String,
    onCopy: () -> Unit,
    onShare: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "YOUR UNIQUE REFERRAL CODE",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White.copy(alpha = 0.7f),
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = referralCode,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onCopy,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    border = ButtonDefaults.outlinedButtonBorder.copy(width = 1.dp)
                ) {
                    Text("Copy Code", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onShare,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Share", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun StatsSection(
    invited: Int,
    converted: Int,
    balance: Double,
    pending: Double
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Total Invited",
                value = invited.toString(),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Converted",
                value = converted.toString(),
                modifier = Modifier.weight(1f),
                valueColor = MaterialTheme.colorScheme.secondary
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Available Balance",
                value = "₹${balance.toInt()}",
                modifier = Modifier.weight(1f),
                valueColor = MaterialTheme.colorScheme.primary
            )
            StatCard(
                title = "Pending Earnings",
                value = "₹${pending.toInt()}",
                modifier = Modifier.weight(1f),
                valueColor = Color(0xFFFF9800)
            )
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = valueColor
            )
        }
    }
}

@Composable
fun ReferralHistoryTabs(
    referrals: List<ReferralDto>,
    claims: List<ReferralClaimDto>
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("My Referrals", "Payout Claims")

    Column(modifier = Modifier.fillMaxWidth()) {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title, fontWeight = FontWeight.Bold) }
                )
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        if (selectedTab == 0) {
            if (referrals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No referrals submitted yet.", color = MaterialTheme.colorScheme.outline)
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    referrals.forEach { referral ->
                        ReferralRow(referral)
                    }
                }
            }
        } else {
            if (claims.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No claims submitted yet.", color = MaterialTheme.colorScheme.outline)
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    claims.forEach { claim ->
                        ClaimRow(claim)
                    }
                }
            }
        }
    }
}

@Composable
fun ReferralRow(referral: ReferralDto) {
    val statusColor = when (referral.status) {
        "Reward Credited" -> MaterialTheme.colorScheme.secondary
        "Purchased" -> MaterialTheme.colorScheme.secondary
        "Contacted" -> MaterialTheme.colorScheme.primary
        else -> MaterialTheme.colorScheme.outline
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(referral.refereeName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text(
                    text = referral.status,
                    color = statusColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Product: ${referral.productName}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                Text("Est. Reward: ₹${referral.rewardAmount.toInt()}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            }
            if (referral.purchaseAmount != null && referral.purchaseAmount > 0) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Purchase Amount: ₹${referral.purchaseAmount.toInt()}", fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
            }
        }
    }
}

@Composable
fun ClaimRow(claim: ReferralClaimDto) {
    val statusColor = when (claim.status) {
        "Completed" -> MaterialTheme.colorScheme.secondary
        "Approved" -> MaterialTheme.colorScheme.secondary
        "Rejected" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.outline
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(10.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("₹${claim.amount.toInt()} payout request", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                Text(
                    text = claim.status,
                    color = statusColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text("Method: ${claim.payoutMethod}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
            Spacer(modifier = Modifier.height(2.dp))
            Text("Details: ${claim.payoutDetails}", fontSize = 12.sp, color = MaterialTheme.colorScheme.outline)
        }
    }
}

@Composable
fun ReferFriendDialog(
    products: List<ProductDto>,
    isSubmitting: Boolean,
    errorMsg: String?,
    onSubmit: (String, String, ProductDto) -> Unit,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var selectedProduct by remember { mutableStateOf<ProductDto?>(null) }
    var showDropdown by remember { mutableStateOf(false) }

    LaunchedEffect(products) {
        if (products.isNotEmpty()) {
            selectedProduct = products.first()
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Refer a Friend", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

                TextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Friend's Full Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                TextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Friend's Phone Number") },
                    modifier = Modifier.fillMaxWidth()
                )

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(
                        onClick = { showDropdown = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(selectedProduct?.name ?: "Select Product Interest")
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }
                    DropdownMenu(
                        expanded = showDropdown,
                        onDismissRequest = { showDropdown = false }
                    ) {
                        products.forEach { prod ->
                            DropdownMenuItem(
                                text = { Text(prod.name) },
                                onClick = {
                                    selectedProduct = prod
                                    showDropdown = false
                                }
                            )
                        }
                    }
                }

                if (errorMsg != null) {
                    Text(errorMsg, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val prod = selectedProduct
                            if (name.isNotBlank() && phone.isNotBlank() && prod != null) {
                                onSubmit(name, phone, prod)
                            }
                        },
                        enabled = name.isNotBlank() && phone.isNotBlank() && selectedProduct != null && !isSubmitting
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                        } else {
                            Text("Submit Lead")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClaimPayoutDialog(
    availableBalance: Double,
    isSubmitting: Boolean,
    errorMsg: String?,
    onSubmit: (Double, String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var amount by remember { mutableStateOf(availableBalance.toString()) }
    var details by remember { mutableStateOf("") }
    val methods = listOf("UPI", "Bank Transfer")
    var selectedMethod by remember { mutableStateOf("UPI") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Request Payout Payout", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

                TextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Payout Amount (Min ₹500)") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Method Tab-like selectors
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    methods.forEach { method ->
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { selectedMethod = method },
                            colors = CardDefaults.cardColors(
                                containerColor = if (selectedMethod == method) MaterialTheme.colorScheme.primary else Color.LightGray.copy(alpha = 0.3f)
                            )
                        ) {
                            Box(modifier = Modifier.fillMaxWidth().padding(10.dp), contentAlignment = Alignment.Center) {
                                Text(
                                    text = method,
                                    color = if (selectedMethod == method) Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }

                TextField(
                    value = details,
                    onValueChange = { details = it },
                    label = { Text(if (selectedMethod == "UPI") "UPI ID (e.g. mobile@ybl)" else "Bank Name, A/C No, IFSC") },
                    modifier = Modifier.fillMaxWidth()
                )

                if (errorMsg != null) {
                    Text(errorMsg, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, enabled = !isSubmitting) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val amt = amount.toDoubleOrNull()
                            if (amt != null && amt >= 500 && details.isNotBlank()) {
                                onSubmit(amt, selectedMethod, details)
                            }
                        },
                        enabled = amount.toDoubleOrNull() != null && amount.toDouble() >= 500 && details.isNotBlank() && !isSubmitting
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                        } else {
                            Text("Request")
                        }
                    }
                }
            }
        }
    }
}
