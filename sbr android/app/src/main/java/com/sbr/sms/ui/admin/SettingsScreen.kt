package com.sbr.sms.ui.admin

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import com.sbr.sms.data.api.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AdminSettingsViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    val reviewUrl = MutableStateFlow("")
    val supportPhone = MutableStateFlow("+91 99000 00000")
    val supportEmail = MutableStateFlow("support@sbr.sriddha.com")
    val isLoading = MutableStateFlow(false)
    val saveMessage = MutableStateFlow<String?>(null)

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val res = apiService.getSettings()
                if (res.isSuccessful && res.body()?.data != null) {
                    val settings = res.body()!!.data!!
                    settings["reviewUrl"]?.let { reviewUrl.value = it }
                }
            } catch (e: Exception) {
                // Keep default
            } finally {
                isLoading.value = false
            }
        }
    }

    fun saveSettings(url: String, phone: String, email: String, onComplete: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val body = mapOf("key" to "reviewUrl", "value" to url)
                val res = apiService.updateSettings(body)
                if (res.isSuccessful) {
                    reviewUrl.value = url
                    supportPhone.value = phone
                    supportEmail.value = email
                    saveMessage.value = "Settings saved successfully!"
                    onComplete(true, "Settings saved successfully!")
                } else {
                    onComplete(false, "Failed to save settings.")
                }
            } catch (e: Exception) {
                saveMessage.value = e.localizedMessage
                onComplete(false, e.localizedMessage ?: "Failed to save settings")
            } finally {
                isLoading.value = false
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavHostController,
    viewModel: AdminSettingsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val currentReviewUrl by viewModel.reviewUrl.collectAsState()
    val currentPhone by viewModel.supportPhone.collectAsState()
    val currentEmail by viewModel.supportEmail.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var reviewUrlText by remember(currentReviewUrl) { mutableStateOf(currentReviewUrl) }
    var phoneText by remember(currentPhone) { mutableStateOf(currentPhone) }
    var emailText by remember(currentEmail) { mutableStateOf(currentEmail) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "System & Admin Settings",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        // Google Review URL Configuration Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Google Review URL",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
                Text(
                    text = "This link is automatically sent to customers via email and push notifications when an agent closes a service request with 'Request Review'.",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                OutlinedTextField(
                    value = reviewUrlText,
                    onValueChange = { reviewUrlText = it },
                    label = { Text("Review URL") },
                    placeholder = { Text("https://g.page/r/...") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Link, contentDescription = null) }
                )
            }
        }

        // Support Contact Configuration Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.SupportAgent, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Support Contacts",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
                OutlinedTextField(
                    value = phoneText,
                    onValueChange = { phoneText = it },
                    label = { Text("Helpline / WhatsApp Number") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) }
                )
                OutlinedTextField(
                    value = emailText,
                    onValueChange = { emailText = it },
                    label = { Text("Support Email") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) }
                )
            }
        }

        // App Information Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("App & Server Information", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text("App Version: 1.2 (Build 5)", fontSize = 12.sp, color = Color.Gray)
                Text("Backend Host: https://sbr.sriddha.com", fontSize = 12.sp, color = Color.Gray)
                Text("Target SDK: Android 36 (Vanilla Material 3 + Jetpack Compose)", fontSize = 12.sp, color = Color.Gray)
            }
        }

        Button(
            onClick = {
                viewModel.saveSettings(reviewUrlText, phoneText, emailText) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(14.dp),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
            } else {
                Icon(Icons.Default.Save, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Save All Settings", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }
        }
    }
}
