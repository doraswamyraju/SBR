package com.sbr.sms.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ProductRequest
import com.sbr.sms.ui.common.viewmodels.ProductsViewModel

val CATEGORIES = listOf(
    "All",
    "Solar Heating",
    "Water Treatment",
    "RO Purification",
    "Solar Power",
    "Heat Pumps",
    "Other Services"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsCatalogScreen(
    isAdmin: Boolean = false,
    viewModel: ProductsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<ProductDto?>(null) }

    val filteredProducts = remember(uiState.products, uiState.searchQuery, uiState.selectedCategory) {
        uiState.products.filter { prod ->
            val matchesCategory = uiState.selectedCategory == "All" || prod.category == uiState.selectedCategory
            val matchesSearch = uiState.searchQuery.isBlank() || 
                prod.name.contains(uiState.searchQuery, ignoreCase = true) ||
                (prod.description?.contains(uiState.searchQuery, ignoreCase = true) == true)
            matchesCategory && matchesSearch
        }
    }

    Scaffold(
        floatingActionButton = {
            if (isAdmin) {
                FloatingActionButton(
                    onClick = {
                        editingProduct = null
                        showDialog = true
                    },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Product", tint = Color.White)
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Title Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Products & Services",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "Explore our solar, water treatment, and heat pump catalog",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = { viewModel.loadProducts() }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Search Box
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search products or services...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Category Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(CATEGORIES) { cat ->
                    FilterChip(
                        selected = uiState.selectedCategory == cat,
                        onClick = { viewModel.setCategory(cat) },
                        label = { Text(cat) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (filteredProducts.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        "No products found",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredProducts) { product ->
                        ProductItemCard(
                            product = product,
                            isAdmin = isAdmin,
                            onEdit = {
                                editingProduct = product
                                showDialog = true
                            },
                            onDelete = {
                                viewModel.deleteProduct(product.id)
                            }
                        )
                    }
                }
            }
        }
    }

    if (showDialog && isAdmin) {
        ProductEditDialog(
            product = editingProduct,
            onDismiss = { showDialog = false },
            onSave = { req ->
                if (editingProduct != null) {
                    viewModel.updateProduct(editingProduct!!.id, req)
                } else {
                    viewModel.createProduct(req)
                }
                showDialog = false
            }
        )
    }
}

@Composable
fun ProductItemCard(
    product: ProductDto,
    isAdmin: Boolean,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(modifier = Modifier.weight(1f)) {
                    if (!product.image.isNull_or_blank()) {
                        AsyncImage(
                            model = product.image,
                            contentDescription = product.name,
                            modifier = Modifier
                                .size(72.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(MaterialTheme.colorScheme.surface),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                    }
                    Column {
                        Text(
                            product.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        val sub = product.subtitle
                        if (!sub.isNullOrBlank()) {
                            Text(
                                sub,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        AssistChip(
                            onClick = {},
                            label = { Text(product.category ?: "General", fontSize = 11.sp) }
                        )
                    }
                }

                if (isAdmin) {
                    Row {
                        IconButton(onClick = onEdit) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = MaterialTheme.colorScheme.primary)
                        }
                        IconButton(onClick = onDelete) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }

            val desc = product.description
            if (!desc.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    desc,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 3
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    if (product.basePrice != null && product.basePrice > 0) {
                        Text(
                            "₹${product.basePrice.toInt()}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    if (product.mrp != null && product.mrp > (product.basePrice ?: 0.0)) {
                        Text(
                            "MRP: ₹${product.mrp.toInt()}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                }

                // Commission/Reward Tag
                if (product.commissionValue != null && product.commissionValue > 0) {
                    val rewardText = if (product.commissionType == "percentage") {
                        "${product.commissionValue}% Commission"
                    } else {
                        "₹${product.commissionValue.toInt()} Flat Reward"
                    }
                    Surface(
                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CardGiftcard,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = Color(0xFF059669)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                rewardText,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF059669)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun String?.isNull_or_blank() = this.isNullOrBlank()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductEditDialog(
    product: ProductDto?,
    onDismiss: () -> Unit,
    onSave: (ProductRequest) -> Unit
) {
    var name by remember { mutableStateOf(product?.name ?: "") }
    var category by remember { mutableStateOf(product?.category ?: CATEGORIES[1]) }
    var subtitle by remember { mutableStateOf(product?.subtitle ?: "") }
    var description by remember { mutableStateOf(product?.description ?: "") }
    var basePrice by remember { mutableStateOf(product?.basePrice?.toString() ?: "") }
    var mrp by remember { mutableStateOf(product?.mrp?.toString() ?: "") }
    var commissionType by remember { mutableStateOf(product?.commissionType ?: "fixed") }
    var commissionValue by remember { mutableStateOf(product?.commissionValue?.toString() ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (product != null) "Edit Product/Service" else "Add New Product/Service") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Product Name *") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = subtitle,
                    onValueChange = { subtitle = it },
                    label = { Text("Subtitle / Tagline") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = basePrice,
                        onValueChange = { basePrice = it },
                        label = { Text("Base Price (₹)") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = mrp,
                        onValueChange = { mrp = it },
                        label = { Text("MRP (₹)") },
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = commissionValue,
                        onValueChange = { commissionValue = it },
                        label = { Text("Referral Reward") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = commissionType,
                        onValueChange = { commissionType = it },
                        label = { Text("Type (fixed/percentage)") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        val req = ProductRequest(
                            name = name,
                            category = category,
                            subtitle = subtitle.ifBlank { null },
                            description = description.ifBlank { null },
                            basePrice = basePrice.toDoubleOrNull(),
                            mrp = mrp.toDoubleOrNull(),
                            commissionType = commissionType,
                            commissionValue = commissionValue.toDoubleOrNull()
                        )
                        onSave(req)
                    }
                },
                enabled = name.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
