package com.sbr.sms.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.Customer
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.admin.viewmodels.CustomerManagementViewModel
import com.sbr.sms.ui.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerManagementScreen(
    navController: NavHostController,
    viewModel: CustomerManagementViewModel = hiltViewModel()
) {
    val customers by viewModel.customers.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val statusMsg by viewModel.statusMessage.collectAsState()
    val errorMsg by viewModel.errorMessage.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(statusMsg) {
        statusMsg?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    LaunchedEffect(errorMsg) {
        errorMsg?.let {
            snackbarHostState.showSnackbar("Error: $it")
            viewModel.clearMessages()
        }
    }

    var customerToDelete by remember { mutableStateOf<Customer?>(null) }
    var customerForPasswordModal by remember { mutableStateOf<Customer?>(null) }
    var showManualPasswordDialog by remember { mutableStateOf(false) }

    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordError by remember { mutableStateOf<String?>(null) }

    // Delete Confirmation Dialog
    if (customerToDelete != null) {
        AlertDialog(
            onDismissRequest = { customerToDelete = null },
            title = { Text("Delete Customer") },
            text = { Text("Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.") },
            confirmButton = {
                Button(
                    onClick = {
                        customerToDelete?.let { viewModel.deleteCustomer(it.id) }
                        customerToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { customerToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Password Management Options Modal
    if (customerForPasswordModal != null) {
        val target = customerForPasswordModal!!
        AlertDialog(
            onDismissRequest = { customerForPasswordModal = null },
            title = { Text("Password & Access Control") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("User: ${target.name} (${target.email ?: "No email"})", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text("Choose how you would like to reset or update this customer's account credentials:", fontSize = 13.sp, color = Color.Gray)

                    OutlinedButton(
                        onClick = {
                            viewModel.sendPasswordResetEmail(target.id)
                            customerForPasswordModal = null
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Email, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Send Reset Link to Email")
                    }

                    FilledTonalButton(
                        onClick = {
                            newPassword = ""
                            confirmPassword = ""
                            passwordError = null
                            showManualPasswordDialog = true
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Key, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Override Password Manually")
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { customerForPasswordModal = null }) {
                    Text("Close")
                }
            }
        )
    }

    // Manual Password Entry Dialog
    if (showManualPasswordDialog && customerForPasswordModal != null) {
        val target = customerForPasswordModal!!
        AlertDialog(
            onDismissRequest = { showManualPasswordDialog = false },
            title = { Text("Set New Password") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Enter new password for ${target.name} (min 6 characters):", fontSize = 13.sp)

                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = { Text("New Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = { Text("Confirm Password") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (!passwordError.isNullOrBlank()) {
                        Text(passwordError!!, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newPassword.length < 6) {
                            passwordError = "Password must be at least 6 characters."
                            return@Button
                        }
                        if (newPassword != confirmPassword) {
                            passwordError = "Passwords do not match."
                            return@Button
                        }
                        viewModel.setManualPassword(target.id, newPassword) {
                            showManualPasswordDialog = false
                            customerForPasswordModal = null
                        }
                    }
                ) {
                    Text("Save Password")
                }
            },
            dismissButton = {
                TextButton(onClick = { showManualPasswordDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(AppRoutes.AdminAddEditCustomer.createRoute(null)) },
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Customer")
            }
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.onSearchQueryChange(it) },
                label = { Text("Search by Name or Phone") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            )

            if (customers.isEmpty() && searchQuery.isNotBlank()) {
                EmptyState(message = "No customers match your search.")
            } else if (customers.isEmpty()) {
                EmptyState(message = "No customers found. Tap the '+' button to add one.")
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(customers, key = { it.id }) { customer ->
                        CustomerInfoCard(
                            customer = customer,
                            onCardClick = {
                                navController.navigate(AppRoutes.AdminAddEditCustomer.createRoute(customer.id))
                            },
                            onPasswordClick = {
                                customerForPasswordModal = customer
                            },
                            onDeleteClick = {
                                customerToDelete = customer
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CustomerInfoCard(
    customer: Customer,
    onCardClick: () -> Unit,
    onPasswordClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onCardClick),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier.padding(start = 16.dp, top = 12.dp, bottom = 12.dp, end = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Person,
                contentDescription = "Customer",
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(customer.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                customer.phone?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
                customer.email?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                customer.address?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Password Reset Action Button
            IconButton(onClick = onPasswordClick) {
                Icon(
                    Icons.Default.Key,
                    contentDescription = "Manage Password",
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            // Delete Customer Button
            IconButton(onClick = onDeleteClick) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete Customer",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}