package com.sbr.sms.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.Customer
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.admin.viewmodels.AdminCreateRequestViewModel
import com.sbr.sms.ui.admin.viewmodels.CreateRequestUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminCreateRequestScreen(
    navController: NavHostController,
    viewModel: AdminCreateRequestViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedCustomer by viewModel.selectedCustomer.collectAsState()
    val serviceType by viewModel.serviceType.collectAsState()
    val description by viewModel.description.collectAsState()
    val isRecurring by viewModel.isRecurring.collectAsState()
    var showCustomerDialog by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is CreateRequestUiState.Success) {
            navController.popBackStack()
        }
    }

    if (showCustomerDialog) {
        CustomerSelectionDialog(
            viewModel = viewModel,
            onDismiss = { showCustomerDialog = false },
            onCustomerSelected = {
                viewModel.onCustomerSelected(it)
                showCustomerDialog = false
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create New Service Request") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // ✅ FIXED: Wrapped the TextField in a clickable Box
            Box(modifier = Modifier.clickable { showCustomerDialog = true }) {
                OutlinedTextField(
                    value = selectedCustomer?.name ?: "No customer selected",
                    onValueChange = {},
                    label = { Text("Customer") },
                    enabled = false, // Disable the field to let clicks pass through
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = "Select Customer") },
                    colors = OutlinedTextFieldDefaults.colors(
                        // Style the disabled field to look enabled
                        disabledTextColor = MaterialTheme.colorScheme.onSurface,
                        disabledBorderColor = MaterialTheme.colorScheme.outline,
                        disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }

            TextButton(
                onClick = {
                    navController.navigate(AppRoutes.AdminAddEditCustomer.createRoute(null))
                }
            ) {
                Text("Or, Add a New Customer")
            }

            HorizontalDivider()

            OutlinedTextField(
                value = serviceType,
                onValueChange = { viewModel.onServiceTypeChange(it) },
                label = { Text("Service Type") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = description,
                onValueChange = { viewModel.onDescriptionChange(it) },
                label = { Text("Description (Optional)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { viewModel.onRecurringChange(!isRecurring) }
            ) {
                Checkbox(checked = isRecurring, onCheckedChange = { viewModel.onRecurringChange(it) })
                Text("Automatically create a new request every 3 months", modifier = Modifier.padding(start = 8.dp))
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { viewModel.createRequest() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = uiState !is CreateRequestUiState.Loading && selectedCustomer != null
            ) {
                if (uiState is CreateRequestUiState.Loading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                } else {
                    Text("Submit Request")
                }
            }

            if (uiState is CreateRequestUiState.Error) {
                Text(
                    text = (uiState as CreateRequestUiState.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun CustomerSelectionDialog(
    viewModel: AdminCreateRequestViewModel,
    onDismiss: () -> Unit,
    onCustomerSelected: (Customer) -> Unit
) {
    val allCustomers by viewModel.allCustomers.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    val filteredCustomers = remember(searchQuery, allCustomers) {
        if (searchQuery.isBlank()) {
            allCustomers
        } else {
            allCustomers.filter {
                it.name.contains(searchQuery, ignoreCase = true) || it.phone?.contains(searchQuery) == true
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 500.dp)) {
            Column {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("Search Customers") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                )
                LazyColumn(modifier = Modifier.padding(horizontal = 16.dp)) {
                    if (filteredCustomers.isEmpty()) {
                        item {
                            Text(
                                text = if (allCustomers.isEmpty()) "No customers found." else "No customers match your search.",
                                modifier = Modifier.padding(vertical = 16.dp)
                            )
                        }
                    }
                    items(filteredCustomers, key = { it.id }) { customer ->
                        Text(
                            text = "${customer.name} (${customer.phone ?: "No phone"})",
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onCustomerSelected(customer) }
                                .padding(vertical = 12.dp)
                        )
                    }
                }
            }
        }
    }
}