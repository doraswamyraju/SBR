package com.sbr.sms.ui.agent

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.CreateIndentItemDto
import com.sbr.sms.data.api.CreateIndentRequest
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.models.AgentIndent
import com.sbr.sms.data.models.AgentInventoryItem
import com.sbr.sms.ui.theme.SBRBlue
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
    val isSubmitting = MutableStateFlow(false)
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
                message.value = e.localizedMessage ?: "Failed to load inventory data"
            } finally {
                isLoading.value = false
            }
        }
    }

    fun submitMultiItemIndent(
        items: List<CreateIndentItemDto>,
        urgency: String = "NORMAL",
        remarks: String,
        onSuccess: () -> Unit
    ) {
        if (items.isEmpty()) {
            message.value = "Please add at least one item to the requisition."
            return
        }

        viewModelScope.launch {
            isSubmitting.value = true
            try {
                val req = CreateIndentRequest(
                    items = items,
                    urgency = urgency.uppercase(),
                    agentRemarks = remarks.ifBlank { null }
                )
                val res = apiService.createIndent(req)
                if (res.isSuccessful && res.body()?.success == true) {
                    message.value = "Requisition indent submitted successfully with ${items.size} item(s)!"
                    loadData()
                    onSuccess()
                } else {
                    message.value = res.body()?.error ?: "Failed to submit requisition indent."
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage ?: "Network error submitting indent."
            } finally {
                isSubmitting.value = false
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentInventoryScreen(
    viewModel: AgentInventoryViewModel = hiltViewModel()
) {
    val items by viewModel.items.collectAsState()
    val indents by viewModel.indents.collectAsState()
    val products by viewModel.products.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()
    val message by viewModel.message.collectAsState()

    var selectedTab by remember { mutableStateOf(0) }
    var showIndentDialog by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(message) {
        message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.message.value = null
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            Surface(
                color = Color.White,
                tonalElevation = 8.dp,
                shadowElevation = 8.dp
            ) {
                Button(
                    onClick = { showIndentDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SBRBlue)
                ) {
                    Icon(Icons.Default.AddCircle, contentDescription = null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Raise Multi-Item Requisition Indent",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC))
        ) {
            // Top Tab Header
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = SBRBlue
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Text(
                            "Van Kit Stock (${items.size})",
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Text(
                            "My Indents (${indents.size})",
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
            }

            Box(modifier = Modifier.weight(1f)) {
                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = SBRBlue)
                    }
                } else if (selectedTab == 0) {
                    // TAB 0: Van Stock Items
                    if (items.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    Icons.Default.Inventory2,
                                    contentDescription = null,
                                    tint = Color.LightGray,
                                    modifier = Modifier.size(64.dp)
                                )
                                Text(
                                    "No spare parts assigned to your van kit.",
                                    color = Color.Gray,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                OutlinedButton(
                                    onClick = { showIndentDialog = true },
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Raise Requisition Indent Now")
                                }
                            }
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
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
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                item.displayName,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = Color(0xFF1E293B)
                                            )
                                            if (!item.sku.isNullOrBlank()) {
                                                Text(
                                                    "SKU: ${item.sku}",
                                                    fontSize = 12.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                            if (item.isLowStock) {
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        Icons.Default.Warning,
                                                        contentDescription = null,
                                                        tint = Color(0xFFDC2626),
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        "Low Stock (Threshold: ${item.minAlertThreshold})",
                                                        color = Color(0xFFDC2626),
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                        }

                                        Surface(
                                            color = if (item.isLowStock) Color(0xFFFEE2E2) else Color(0xFFECFDF5),
                                            shape = RoundedCornerShape(8.dp),
                                            border = BorderStroke(
                                                1.dp,
                                                if (item.isLowStock) Color(0xFFFCA5A5) else Color(0xFFA7F3D0)
                                            )
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
                    // TAB 1: My Indents
                    var indentFilter by remember { mutableStateOf("ALL") }
                    val filteredIndents = remember(indents, indentFilter) {
                        when (indentFilter) {
                            "PENDING" -> indents.filter { it.status.equals("PENDING", ignoreCase = true) || it.status.equals("REQUESTED", ignoreCase = true) }
                            "DISPATCHED" -> indents.filter { it.status.equals("DISPATCHED", ignoreCase = true) || it.status.equals("APPROVED", ignoreCase = true) }
                            "REJECTED" -> indents.filter { it.status.equals("REJECTED", ignoreCase = true) }
                            else -> indents
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf("ALL", "PENDING", "DISPATCHED", "REJECTED").forEach { flt ->
                                val count = when (flt) {
                                    "ALL" -> indents.size
                                    "PENDING" -> indents.count { it.status.equals("PENDING", ignoreCase = true) || it.status.equals("REQUESTED", ignoreCase = true) }
                                    "DISPATCHED" -> indents.count { it.status.equals("DISPATCHED", ignoreCase = true) || it.status.equals("APPROVED", ignoreCase = true) }
                                    "REJECTED" -> indents.count { it.status.equals("REJECTED", ignoreCase = true) }
                                    else -> 0
                                }
                                FilterChip(
                                    selected = indentFilter == flt,
                                    onClick = { indentFilter = flt },
                                    label = { Text("$flt ($count)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = SBRBlue.copy(alpha = 0.15f),
                                        selectedLabelColor = SBRBlue
                                    )
                                )
                            }
                        }

                        if (filteredIndents.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "No indents found for filter '$indentFilter'.",
                                    color = Color.Gray,
                                    fontSize = 14.sp
                                )
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(filteredIndents, key = { it._id }) { ind ->
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = CardDefaults.cardColors(containerColor = Color.White),
                                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(14.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column {
                                                    Text(
                                                        "Indent #${ind._id.takeLast(6).uppercase()}",
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 14.sp
                                                    )
                                                    if (!ind.requestedAt.isNullOrBlank()) {
                                                        Text(
                                                            "Date: ${ind.requestedAt.take(10)}",
                                                            fontSize = 11.sp,
                                                            color = Color.Gray
                                                        )
                                                    }
                                                }

                                                val statusUpper = ind.status.uppercase()
                                                val (statusBg, statusFg) = when (statusUpper) {
                                                    "DISPATCHED", "APPROVED" -> Pair(Color(0xFFD1FAE5), Color(0xFF059669))
                                                    "REJECTED" -> Pair(Color(0xFFFEE2E2), Color(0xFFDC2626))
                                                    else -> Pair(Color(0xFFFEF3C7), Color(0xFFD97706))
                                                }

                                                Surface(
                                                    color = statusBg,
                                                    shape = RoundedCornerShape(6.dp)
                                                ) {
                                                    Text(
                                                        statusUpper,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 11.sp,
                                                        color = statusFg,
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                                    )
                                                }
                                            }

                                            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))

                                            // Items List
                                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                ind.items.forEach { itm ->
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth(),
                                                        horizontalArrangement = Arrangement.SpaceBetween,
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        Text(
                                                            "• ${itm.name}",
                                                            fontWeight = FontWeight.Medium,
                                                            fontSize = 13.sp,
                                                            color = Color(0xFF334155),
                                                            modifier = Modifier.weight(1f)
                                                        )
                                                        Text(
                                                            "Qty: ${itm.requestedQuantity}",
                                                            fontSize = 13.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = Color(0xFF0284C7)
                                                        )
                                                    }
                                                }
                                            }

                                            if (!ind.urgency.isNullOrBlank()) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Text("Urgency: ", fontSize = 11.sp, color = Color.Gray)
                                                    Text(
                                                        ind.urgency.uppercase(),
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = when (ind.urgency.uppercase()) {
                                                            "EMERGENCY", "HIGH" -> Color(0xFFDC2626)
                                                            "URGENT" -> Color(0xFFEA580C)
                                                            else -> Color(0xFF0284C7)
                                                        }
                                                    )
                                                }
                                            }

                                            if (!ind.agentRemarks.isNullOrBlank()) {
                                                Text(
                                                    "Agent Note: ${ind.agentRemarks}",
                                                    fontSize = 11.sp,
                                                    color = Color.Gray
                                                )
                                            }

                                            if (!ind.inchargeRemarks.isNullOrBlank()) {
                                                Surface(
                                                    color = Color(0xFFF1F5F9),
                                                    shape = RoundedCornerShape(6.dp),
                                                    modifier = Modifier.fillMaxWidth()
                                                ) {
                                                    Text(
                                                        "Store Response: ${ind.inchargeRemarks}",
                                                        fontSize = 11.sp,
                                                        color = Color(0xFF334155),
                                                        modifier = Modifier.padding(8.dp)
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // MULTI-ITEM REQUISITION DIALOG
    if (showIndentDialog) {
        MultiItemIndentDialog(
            products = products,
            isSubmitting = isSubmitting,
            onDismiss = { showIndentDialog = false },
            onSubmit = { indentItems, urgency, remarks ->
                viewModel.submitMultiItemIndent(
                    items = indentItems,
                    urgency = urgency,
                    remarks = remarks,
                    onSuccess = {
                        showIndentDialog = false
                        selectedTab = 1 // Switch to My Indents tab
                    }
                )
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MultiItemIndentDialog(
    products: List<ProductDto>,
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (items: List<CreateIndentItemDto>, urgency: String, remarks: String) -> Unit
) {
    // List of items added to this indent
    val indentItems = remember { mutableStateListOf<CreateIndentItemDto>() }

    // Form inputs for adding a single item
    var selectedProductId by remember { mutableStateOf("") }
    var itemQty by remember { mutableIntStateOf(1) }
    var searchQuery by remember { mutableStateOf("") }
    var isProductDropdownOpen by remember { mutableStateOf(false) }

    // Overall indent properties
    var selectedUrgency by remember { mutableStateOf("NORMAL") }
    var remarksText by remember { mutableStateOf("") }

    val filteredProducts = remember(products, searchQuery) {
        if (searchQuery.isBlank()) products
        else products.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    (it.sku ?: "").contains(searchQuery, ignoreCase = true) ||
                    (it.category ?: "").contains(searchQuery, ignoreCase = true)
        }
    }

    val selectedProduct = remember(selectedProductId, products) {
        products.find { it.id == selectedProductId }
    }

    Dialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.92f)
                .padding(vertical = 12.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "New Requisition Indent",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0F172A)
                        )
                        Text(
                            "Add multiple spare parts to requisition",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                    IconButton(
                        onClick = onDismiss,
                        enabled = !isSubmitting
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), color = Color(0xFFE2E8F0))

                // Scrollable Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // SECTION 1: Product Selector Card
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                "1. Select & Add Spare Part",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = SBRBlue
                            )

                            // Dropdown Trigger Button
                            OutlinedCard(
                                onClick = { isProductDropdownOpen = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        if (selectedProduct != null) {
                                            Text(
                                                selectedProduct.name,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 14.sp,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                "Store Stock: ${selectedProduct.stockLevel ?: 0} units | SKU: ${selectedProduct.sku ?: selectedProduct.slug ?: "N/A"}",
                                                fontSize = 11.sp,
                                                color = Color.Gray
                                            )
                                        } else {
                                            Text(
                                                "Tap to Choose Spare Part / Product...",
                                                color = Color.Gray,
                                                fontSize = 13.sp
                                            )
                                        }
                                    }
                                    Icon(
                                        if (isProductDropdownOpen) Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                                        contentDescription = null
                                    )
                                }
                            }

                            // Quantity Stepper + Add Button
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // Qty Stepper
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier
                                        .background(Color.White, RoundedCornerShape(8.dp))
                                        .border(BorderStroke(1.dp, Color(0xFFCBD5E1)), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    IconButton(
                                        onClick = { if (itemQty > 1) itemQty-- },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Remove, contentDescription = "Decrease", modifier = Modifier.size(16.dp))
                                    }
                                    Text(
                                        "$itemQty",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp)
                                    )
                                    IconButton(
                                        onClick = { itemQty++ },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = "Increase", modifier = Modifier.size(16.dp))
                                    }
                                }

                                // Add Button
                                Button(
                                    onClick = {
                                        val prod = selectedProduct ?: return@Button
                                        val existingIndex = indentItems.indexOfFirst { it.productId == prod.id }
                                        if (existingIndex >= 0) {
                                            val old = indentItems[existingIndex]
                                            indentItems[existingIndex] = old.copy(requestedQuantity = old.requestedQuantity + itemQty)
                                        } else {
                                            indentItems.add(
                                                CreateIndentItemDto(
                                                    productId = prod.id,
                                                    name = prod.name,
                                                    sku = prod.sku ?: prod.slug,
                                                    requestedQuantity = itemQty
                                                )
                                            )
                                        }
                                        selectedProductId = ""
                                        itemQty = 1
                                    },
                                    enabled = selectedProduct != null,
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = SBRBlue)
                                ) {
                                    Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("+ Add to Indent", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // SECTION 2: Items in this Indent (Basket)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "2. Items in Requisition (${indentItems.size})",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color(0xFF1E293B)
                            )
                            if (indentItems.isNotEmpty()) {
                                TextButton(
                                    onClick = { indentItems.clear() },
                                    contentPadding = PaddingValues(0.dp)
                                ) {
                                    Text("Clear All", color = Color(0xFFDC2626), fontSize = 12.sp)
                                }
                            }
                        }

                        if (indentItems.isEmpty()) {
                            Surface(
                                color = Color(0xFFF1F5F9),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Default.PlaylistAdd, contentDescription = null, tint = Color.Gray)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        "No items added yet. Select products above to build your indent.",
                                        fontSize = 12.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        } else {
                            indentItems.forEachIndexed { index, item ->
                                Card(
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                item.name,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 13.sp,
                                                color = Color(0xFF1E293B)
                                            )
                                            if (!item.sku.isNullOrBlank()) {
                                                Text(
                                                    "SKU: ${item.sku}",
                                                    fontSize = 11.sp,
                                                    color = Color.Gray
                                                )
                                            }
                                        }

                                        // Stepper to adjust item qty directly in list
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            IconButton(
                                                onClick = {
                                                    if (item.requestedQuantity > 1) {
                                                        indentItems[index] = item.copy(requestedQuantity = item.requestedQuantity - 1)
                                                    } else {
                                                        indentItems.removeAt(index)
                                                    }
                                                },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    if (item.requestedQuantity > 1) Icons.Default.Remove else Icons.Default.DeleteOutline,
                                                    contentDescription = null,
                                                    tint = if (item.requestedQuantity > 1) Color.DarkGray else Color(0xFFDC2626),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }

                                            Surface(
                                                color = Color(0xFFE0F2FE),
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    "${item.requestedQuantity}",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 13.sp,
                                                    color = Color(0xFF0369A1),
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                                )
                                            }

                                            IconButton(
                                                onClick = {
                                                    indentItems[index] = item.copy(requestedQuantity = item.requestedQuantity + 1)
                                                },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // SECTION 3: Urgency Level
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            "3. Urgency / Priority",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF1E293B)
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf(
                                "NORMAL" to Color(0xFF0284C7),
                                "URGENT" to Color(0xFFEA580C),
                                "EMERGENCY" to Color(0xFFDC2626)
                            ).forEach { (urg, color) ->
                                val isSelected = selectedUrgency == urg
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { selectedUrgency = urg },
                                    label = {
                                        Text(
                                            urg,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            fontSize = 11.sp
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = color.copy(alpha = 0.15f),
                                        selectedLabelColor = color
                                    )
                                )
                            }
                        }
                    }

                    // SECTION 4: Remarks
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            "4. Notes / Reason for Store In-Charge",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color(0xFF1E293B)
                        )
                        OutlinedTextField(
                            value = remarksText,
                            onValueChange = { remarksText = it },
                            placeholder = { Text("e.g. For urgent sector 4 solar inverter replacement job", fontSize = 13.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 2,
                            shape = RoundedCornerShape(8.dp)
                        )
                    }
                }

                // FOOTER
                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), color = Color(0xFFE2E8F0))

                val totalUnits = indentItems.sumOf { it.requestedQuantity }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "Total: ${indentItems.size} SKU(s)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E293B)
                        )
                        Text(
                            "$totalUnits total units",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )
                    }

                    Button(
                        onClick = {
                            onSubmit(indentItems.toList(), selectedUrgency, remarksText)
                        },
                        enabled = indentItems.isNotEmpty() && !isSubmitting,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SBRBlue)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(18.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Submitting...")
                        } else {
                            Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Submit Indent (${indentItems.size})", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // Product Picker Dialog
    if (isProductDropdownOpen) {
        Dialog(
            onDismissRequest = { isProductDropdownOpen = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .fillMaxHeight(0.75f)
                    .padding(vertical = 16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Select Spare Part / Item",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        IconButton(onClick = { isProductDropdownOpen = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    }

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by name, SKU or category...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = null)
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (filteredProducts.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No products match '$searchQuery'", color = Color.Gray)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            items(filteredProducts, key = { it.id }) { prod ->
                                Card(
                                    onClick = {
                                        selectedProductId = prod.id
                                        isProductDropdownOpen = false
                                        searchQuery = ""
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (selectedProductId == prod.id) Color(0xFFEFF6FF) else Color(0xFFF8FAFC)
                                    ),
                                    border = BorderStroke(
                                        1.dp,
                                        if (selectedProductId == prod.id) SBRBlue else Color(0xFFE2E8F0)
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                prod.name,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 14.sp
                                            )
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                                modifier = Modifier.padding(top = 2.dp)
                                            ) {
                                                if (!prod.sku.isNullOrBlank()) {
                                                    Text("SKU: ${prod.sku}", fontSize = 11.sp, color = Color.Gray)
                                                }
                                                if (!prod.category.isNullOrBlank()) {
                                                    Text("• ${prod.category}", fontSize = 11.sp, color = Color.Gray)
                                                }
                                            }
                                        }

                                        Surface(
                                            color = if ((prod.stockLevel ?: 0) > 0) Color(0xFFECFDF5) else Color(0xFFFEF2F2),
                                            shape = RoundedCornerShape(6.dp)
                                        ) {
                                            Text(
                                                "Stock: ${prod.stockLevel ?: 0}",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if ((prod.stockLevel ?: 0) > 0) Color(0xFF059669) else Color(0xFFDC2626),
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
