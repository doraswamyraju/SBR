package com.sbr.sms.ui.customer

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.rememberAsyncImagePainter
import com.sbr.sms.ui.common.UiState
import com.sbr.sms.ui.customer.viewmodels.CustomerProfileViewModel
import com.sbr.sms.ui.customer.viewmodels.ProfileScreenState

@Composable
fun CustomerProfileScreen(
    navController: NavHostController,
    viewModel: CustomerProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.onPhotoUriChanged(it) }
    }

    LaunchedEffect(Unit) {
        viewModel.saveStatus.collect { state ->
            when (state) {
                is UiState.Success -> Toast.makeText(context, "Profile saved successfully!", Toast.LENGTH_SHORT).show()
                is UiState.Error -> Toast.makeText(context, "Error saving profile: ${state.message}", Toast.LENGTH_LONG).show()
                else -> {}
            }
        }
    }

    when (val state = uiState) {
        is ProfileScreenState.Loading -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        is ProfileScreenState.Error -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(state.message)
            }
        }
        is ProfileScreenState.Success -> {
            val user = state.user
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(contentAlignment = Alignment.BottomEnd) {
                    Image(
                        painter = rememberAsyncImagePainter(
                            // FIX: Corrected the placeholder URL string
                            model = user.photoUri ?: user.photoUrl ?: "https://placehold.co/400x400/0D1B4F/FFFFFF?text=${user.name.firstOrNull()?.uppercase()}"
                        ),
                        contentDescription = "Profile Photo",
                        modifier = Modifier.size(120.dp).clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    FloatingActionButton(
                        onClick = { imagePickerLauncher.launch("image/*") },
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Profile Photo")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(value = user.name, onValueChange = { viewModel.onNameChanged(it) }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = user.email, onValueChange = { /* Email is read-only */ }, label = { Text("Email Address") }, modifier = Modifier.fillMaxWidth(), readOnly = true)
                OutlinedTextField(value = user.phone, onValueChange = { viewModel.onPhoneChanged(it) }, label = { Text("Phone Number") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = user.address, onValueChange = { viewModel.onAddressChanged(it) }, label = { Text("Primary Address") }, modifier = Modifier.fillMaxWidth())

                Spacer(modifier = Modifier.weight(1f))

                if (state.isSaving) {
                    CircularProgressIndicator()
                } else {
                    Button(
                        onClick = { viewModel.saveProfile() },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        enabled = state.canBeSaved
                    ) {
                        Text("Save Changes")
                    }
                }
            }
        }
    }
}