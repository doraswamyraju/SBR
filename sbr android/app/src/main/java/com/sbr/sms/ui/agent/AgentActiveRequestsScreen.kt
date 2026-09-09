package com.sbr.sms.ui.agent

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.navigation.NavHostController
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.ui.agent.viewmodels.AgentDashboardUiState
import com.sbr.sms.ui.agent.viewmodels.AgentRequestsViewModel
import com.sbr.sms.ui.agent.viewmodels.RequestWithCustomerDetails
import com.sbr.sms.ui.common.components.PaymentDetailsDialog
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.sbr.sms.ui.common.components.JobTimer
import java.io.File

private fun createImageUri(context: Context): Uri {
    val imageFile = File.createTempFile(
        "JPEG_${System.currentTimeMillis()}_",
        ".jpg",
        File(context.cacheDir, "images").apply { mkdirs() }
    )
    return FileProvider.getUriForFile(
        context,
        "${context.packageName}.provider",
        imageFile
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun AgentActiveRequestsScreen(
    navController: NavHostController? = null,
    viewModel: AgentRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isUploading by viewModel.isUploading.collectAsState()
    val context = LocalContext.current

    var showPaymentBreakdownDialog by remember { mutableStateOf(false) }
    var showReviewDialog by remember { mutableStateOf(false) }
    var tempImageUri by remember { mutableStateOf<Uri?>(null) }

    // Variable holds the full details object.
    val activeRequestDetails = (uiState as? AgentDashboardUiState.Success)?.activeRequest

    if (showPaymentBreakdownDialog && activeRequestDetails != null) {
        AgentPaymentBreakdownDialog(
            job = activeRequestDetails.request,
            apiService = viewModel.apiService,
            onDismiss = { showPaymentBreakdownDialog = false },
            onCompletedSuccess = {
                showPaymentBreakdownDialog = false
                viewModel.refresh()
            }
        )
    }

    if (showReviewDialog && activeRequestDetails != null && tempImageUri != null) {
        AlertDialog(
            onDismissRequest = {
                showReviewDialog = false
                tempImageUri = null
            },
            title = { Text("Complete Service") },
            text = { Text("Would you like to send a Google Maps review request to the customer via Email and Push Notification?") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.handleImageUpload(activeRequestDetails.request.id, tempImageUri!!, "after", requestReview = true)
                        showReviewDialog = false
                        showPaymentBreakdownDialog = true
                    }
                ) {
                    Text("Yes, Request Review")
                }
            },
            dismissButton = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextButton(
                        onClick = {
                            viewModel.handleImageUpload(activeRequestDetails.request.id, tempImageUri!!, "after", requestReview = false)
                            showReviewDialog = false
                            showPaymentBreakdownDialog = true
                        }
                    ) {
                        Text("No, Complete Only")
                    }
                    Spacer(Modifier.width(8.dp))
                    TextButton(
                        onClick = {
                            showReviewDialog = false
                            tempImageUri = null
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            }
        )
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            tempImageUri?.let { uri ->
                val imageTypeToUpload = viewModel.imageTypeToUpload.value
                if (activeRequestDetails != null && imageTypeToUpload != null) {
                    if (imageTypeToUpload == "after") {
                        showReviewDialog = true
                    } else {
                        viewModel.handleImageUpload(activeRequestDetails.request.id, uri, imageTypeToUpload)
                    }
                }
            }
        }
    }

    val cameraPermissionState = rememberPermissionState(android.Manifest.permission.CAMERA)

    val launchCamera = { imageType: String ->
        viewModel.setImageTypeToUpload(imageType)
        if (cameraPermissionState.status.isGranted) {
            val uri = createImageUri(context)
            tempImageUri = uri
            cameraLauncher.launch(uri)
        } else {
            cameraPermissionState.launchPermissionRequest()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Active Service") }) }
    ) { padding ->
        Box(
            modifier = Modifier.padding(padding).fillMaxSize(),
            contentAlignment = Alignment.TopCenter
        ) {
            when (val state = uiState) {
                is AgentDashboardUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is AgentDashboardUiState.Error -> Text(state.message, modifier = Modifier.align(Alignment.Center))
                is AgentDashboardUiState.Success -> {
                    val details = state.activeRequest
                    if (details == null) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No active service.")
                        }
                    } else {
                        ActiveRequestCard(
                            details = details, // Pass the full details object
                            onUpdateStatus = { newStatus ->
                                viewModel.updateRequestStatus(details.request.id, newStatus)
                            },
                            onStartNavigation = {
                                navController?.navigate(com.sbr.sms.navigation.AppRoutes.AgentLiveCustomerRoute.createRoute(details.request.id))
                            },
                            onUploadBefore = { launchCamera("before") },
                            onUploadAfter = { launchCamera("after") },
                            onCollectPayment = { showPaymentBreakdownDialog = true }
                        )
                    }
                }
            }

            if (isUploading) {
                Surface(color = MaterialTheme.colorScheme.background.copy(alpha = 0.6f), modifier = Modifier.fillMaxSize()) {
                    Box(contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator()
                            Spacer(Modifier.height(8.dp))
                            Text("Uploading Image...")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveRequestCard(
    details: RequestWithCustomerDetails,
    onUpdateStatus: (String) -> Unit,
    onStartNavigation: () -> Unit,
    onUploadBefore: () -> Unit,
    onUploadAfter: () -> Unit,
    onCollectPayment: () -> Unit
) {
    val request = details.request
    val context = LocalContext.current

    Card(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            ListItem(
                headlineContent = { Text(request.serviceType, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) },
                supportingContent = { Text("Service Type") }
            )
            Divider()

            ListItem(
                headlineContent = { Text(details.customerName, fontWeight = FontWeight.SemiBold) },
                leadingContent = { Icon(Icons.Default.Person, contentDescription = "Customer") },
                supportingContent = { Text("Customer") }
            )

            ListItem(
                headlineContent = { Text(request.status, fontWeight = FontWeight.SemiBold) },
                leadingContent = { Icon(Icons.Default.Info, contentDescription = "Status") },
                supportingContent = { Text("Current Status") }
            )
            ListItem(
                headlineContent = { Text(request.customerAddress) },
                leadingContent = { Icon(Icons.Default.LocationOn, contentDescription = "Address") },
                supportingContent = { Text("Customer Address") }
            )
            JobTimer(request = request)

            // Allocated Spare Parts Card
            if (request.requiredComponents.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Build,
                                contentDescription = "Spares",
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "Allocated Van Spares (${request.requiredComponents.size})",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        request.requiredComponents.forEach { comp ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        comp.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    if (!comp.sku.isNullOrBlank()) {
                                        Text(
                                            "SKU: ${comp.sku}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Text(
                                    "${comp.quantity}x • ₹${"%,.0f".format((comp.unitPrice ?: 0.0) * comp.quantity)}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            if(request.paymentStatus == "Paid") {
                ListItem(
                    headlineContent = { Text("₹${"%,.0f".format(request.paymentAmount ?: request.finalAmount ?: 0.0)} via ${request.paymentMethod ?: "Cash"}", fontWeight = FontWeight.Bold) },
                    leadingContent = { Icon(Icons.Default.Done, contentDescription = "Payment") },
                    supportingContent = { Text("Payment Collected") }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Navigation Button
            Button(
                onClick = onStartNavigation,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(ButtonDefaults.IconSize))
                Spacer(modifier = Modifier.size(ButtonDefaults.IconSpacing))
                Text("In-App Route Navigation")
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Call Customer button
            OutlinedButton(
                onClick = {
                    details.customerPhone?.let { phone ->
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                        context.startActivity(intent)
                    }
                },
                enabled = !details.customerPhone.isNullOrBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call Icon", modifier = Modifier.size(ButtonDefaults.IconSize))
                Spacer(modifier = Modifier.size(ButtonDefaults.IconSpacing))
                Text("Call Customer")
            }
            Spacer(modifier = Modifier.height(8.dp))

            when(request.status) {
                "Accepted" -> {
                    Button(onClick = { onUpdateStatus("In Progress") }, modifier = Modifier.fillMaxWidth()) {
                        Text("Start Work / Mark as Arrived")
                    }
                }
                "In Progress" -> {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Button(onClick = onUploadBefore, modifier = Modifier.weight(1f), enabled = request.beforeImageUrl == null) {
                            Text(if (request.beforeImageUrl == null) "Upload Before" else "Before Done ✓")
                        }
                        Button(onClick = onUploadAfter, modifier = Modifier.weight(1f), enabled = request.beforeImageUrl != null) {
                            Text("Upload After & Complete")
                        }
                    }
                }
                "Completed" -> {
                    Button(onClick = onCollectPayment, modifier = Modifier.fillMaxWidth()) {
                        Text("Settle Payment Breakdown & Collect")
                    }
                }
                "Paid" -> {
                    Text("This job is complete.", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.align(Alignment.CenterHorizontally))
                }
            }
        }
    }
}