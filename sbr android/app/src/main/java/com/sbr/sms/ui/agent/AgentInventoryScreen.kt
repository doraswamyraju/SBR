package com.sbr.sms.ui.agent

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.CreateIndentItemDto
import com.sbr.sms.data.api.CreateIndentRequest
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.models.AgentIndent
import com.sbr.sms.data.models.AgentInventoryItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AgentInventoryViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    val items = MutableStateFlow<List<AgentInventoryItem>>(emptyList())
    val indents = MutableStateFlow<List<AgentIndent>>(emptyList())
    val products = MutableStateFlow<List<ProductDto>>(emptyList())
    val isLoading = MutableStateFlow(false)
    val message = MutableStateFlow<String?>(null)

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val invRes = apiService.getMyVanStock()
                if (invRes.isSuccessful && invRes.body()?.success == true) {
                    items.value = invRes.body()?.data ?: emptyList()
                }

                val indRes = apiService.getMyIndents()
                if (indRes.isSuccessful && indRes.body()?.success == true) {
                    indents.value = indRes.body()?.data ?: emptyList()
                }

                val prodRes = apiService.getProducts()
                if (prodRes.isSuccessful && prodRes.body()?.success == true) {
                    products.value = prodRes.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            } finally {
                isLoading.value = false
            }
        }
    }

    fun submitIndent(productId: String, name: String, sku: String?, qty: Int, remarks: String) {
        viewModelScope.launch {
            try {
                val req = CreateIndentRequest(
                    items = listOf(CreateIndentItemDto(productId, name, sku, qty)),
                    urgency = "HIGH",
                    agentRemarks = remarks
                )
                val res = apiService.createIndent(req)
                if (res.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }
}

@Composable
fun AgentInventoryScreen(
    viewModel: AgentInventoryViewModel = hiltViewModel()
) {
    val items by viewModel.items.collectAsState()
    val indents by viewModel.indents.collectAsState()
    val products by viewModel.products.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var selectedTab by remember { mutableStateOf(0) }
    var showIndentDialog by remember { mutableStateOf(false) }

    var selectedProductId by remember { mutableStateOf("") }
    var quantityText by remember { mutableStateOf("1") }
    var remarksText by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("Van Stock (${items.size})") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("My Indents (${indents.size})") })
        }

        Box(modifier = Modifier.weight(1f)) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (selectedTab == 0) {
                if (items.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No spare parts assigned to your van kit.", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(items) { item ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(item.displayName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        if (!item.sku.isNullOrBlank()) {
                                            Text("SKU: ${item.sku}", fontSize = 12.sp, color = Color.Gray)
                                        }
                                        if (item.isLowStock) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(Icons.Default.Warning, contentDescription = null, tint = Color.Red, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Low Stock (Min: ${item.minAlertThreshold})", color = Color.Red, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }

                                    Surface(
                                        color = if (item.isLowStock) Color(0xFFFEE2E2) else Color(0xFFECFDF5),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            "Qty: ${item.quantity}",
                                            fontWeight = FontWeight.Black,
                                            fontSize = 16.sp,
                                            color = if (item.isLowStock) Color(0xFFDC2626) else Color(0xFF059669),
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if (indents.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No indents raised.", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(indents) { ind ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Requisition #${ind._id.takeLast(6)}", fontWeight = FontWeight.Bold)
                                        Surface(
                                            color = when (ind.status) {
                                                "DISPATCHED" -> Color(0xFFD1FAE5)
                                                "REJECTED" -> Color(0xFFFEE2E2)
                                                else -> Color(0xFFFEF3C7)
                                            },
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                ind.status,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                color = when (ind.status) {
                                                    "DISPATCHED" -> Color(0xFF059669)
                                                    "REJECTED" -> Color(0xFFDC2626)
                                                    else -> Color(0xFFD97706)
                                                },
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }

                                    ind.items.forEach { itm ->
                                        Text("${itm.name} x${itm.requestedQuantity}", fontSize = 13.sp)
                                    }

                                    if (!ind.inchargeRemarks.isNullOrBlank()) {
                                        Text("Store note: ${ind.inchargeRemarks}", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Button(
            onClick = { showIndentDialog = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(6.dp))
            Text("Raise Requisition Indent to Store")
        }
    }

    if (showIndentDialog) {
        AlertDialog(
            onDismissRequest = { showIndentDialog = false },
            title = { Text("Raise Indent to Central Store") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    var expanded by remember { mutableStateOf(false) }
                    val selectedProd = products.find { it.id == selectedProductId }

                    Box {
                        OutlinedButton(
                            onClick = { expanded = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(selectedProd?.name ?: "Select Spare Part")
                        }
                        DropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false }
                        ) {
                            products.forEach { prod ->
                                DropdownMenuItem(
                                    text = { Text("${prod.name} (Stock: ${prod.stockLevel ?: 0})") },
                                    onClick = {
                                        selectedProductId = prod.id
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = quantityText,
                        onValueChange = { quantityText = it },
                        label = { Text("Quantity Needed") },
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = remarksText,
                        onValueChange = { remarksText = it },
                        label = { Text("Remarks for Store In-Charge") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val prod = products.find { it.id == selectedProductId }
                        if (prod != null) {
                            val qty = quantityText.toIntOrNull() ?: 1
                            viewModel.submitIndent(prod.id, prod.name, prod.sku, qty, remarksText)
                            showIndentDialog = false
                            selectedProductId = ""
                            remarksText = ""
                        }
                    },
                    enabled = selectedProductId.isNotBlank()
                ) {
                    Text("Submit Requisition")
                }
            },
            dismissButton = {
                TextButton(onClick = { showIndentDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
