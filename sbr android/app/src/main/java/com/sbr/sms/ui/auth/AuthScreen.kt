package com.sbr.sms.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.R.drawable.sbr_logo

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthScreen(
    viewModel: AuthViewModel = hiltViewModel()
) {
    var isLoginTabSelected by remember { mutableStateOf(true) }
    var showForgotPasswordDialog by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }

    // Collect the saved email from the ViewModel
    val savedEmail by viewModel.savedEmail.collectAsState()

    // Use an effect to set the email field once when the screen loads
    LaunchedEffect(savedEmail) {
        if (viewModel.email.isEmpty() && savedEmail.isNotEmpty()) {
            viewModel.email = savedEmail
        }
    }

    LaunchedEffect(viewModel.snackbarMessage) {
        viewModel.snackbarMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.snackbarMessage = null
        }
    }

    if (showForgotPasswordDialog) {
        ForgotPasswordDialog(
            onDismiss = { showForgotPasswordDialog = false },
            onConfirm = { email ->
                viewModel.sendPasswordReset(email)
                showForgotPasswordDialog = false
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(horizontal = 24.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            Image(
                painter = painterResource(id = sbr_logo),
                contentDescription = "SBR Logo",
                modifier = Modifier.height(90.dp).padding(8.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))
            Text("Welcome to SBR", style = MaterialTheme.typography.headlineSmall)
            Text(
                if (isLoginTabSelected) "Sign in to continue" else "Create an account",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(32.dp))

            TabRow(
                selectedTabIndex = if (isLoginTabSelected) 0 else 1,
                modifier = Modifier.fillMaxWidth(0.8f).clip(RoundedCornerShape(50))
            ) {
                Tab(selected = isLoginTabSelected, onClick = { isLoginTabSelected = true }, text = { Text("Login") })
                Tab(selected = !isLoginTabSelected, onClick = { isLoginTabSelected = false }, text = { Text("Sign Up") })
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (isLoginTabSelected) {
                LoginFields(viewModel) { showForgotPasswordDialog = true }
            } else {
                SignUpFields(viewModel)
            }

            Spacer(modifier = Modifier.weight(1f))

            if (viewModel.isLoading) {
                CircularProgressIndicator(modifier = Modifier.padding(bottom = 16.dp))
            }

            Button(
                onClick = { if (isLoginTabSelected) viewModel.loginUser() else viewModel.signupUser() },
                enabled = !viewModel.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text(if (isLoginTabSelected) "Login" else "Sign Up")
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}


@Composable
private fun LoginFields(viewModel: AuthViewModel, onForgotPasswordClicked: () -> Unit) {
    OutlinedTextField(
        value = viewModel.email,
        onValueChange = { viewModel.email = it },
        label = { Text("Email") },
        leadingIcon = { Icon(Icons.Default.MailOutline, contentDescription = null) },
        // THE FIX: Using the full path to the class
        keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(8.dp))
    OutlinedTextField(
        value = viewModel.password,
        onValueChange = { viewModel.password = it },
        label = { Text("Password") },
        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
        visualTransformation = PasswordVisualTransformation(),
        // THE FIX: Using the full path to the class
        keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Password),
        modifier = Modifier.fillMaxWidth()
    )
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
        TextButton(onClick = onForgotPasswordClicked) {
            Text("Forgot Password?")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SignUpFields(viewModel: AuthViewModel) {
    var expanded by remember { mutableStateOf(false) }
    val roles = listOf("Customer", "Agent")

    OutlinedTextField(
        value = viewModel.fullName,
        onValueChange = { viewModel.fullName = it },
        label = { Text("Full Name") },
        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(8.dp))
    OutlinedTextField(
        value = viewModel.email,
        onValueChange = { viewModel.email = it },
        label = { Text("Email") },
        leadingIcon = { Icon(Icons.Default.MailOutline, contentDescription = null) },
        // THE FIX: Using the full path to the class
        keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(8.dp))
    OutlinedTextField(
        value = viewModel.password,
        onValueChange = { viewModel.password = it },
        label = { Text("Password") },
        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
        visualTransformation = PasswordVisualTransformation(),
        // THE FIX: Using the full path to the class
        keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Password),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(8.dp))
    OutlinedTextField(
        value = viewModel.confirmPassword,
        onValueChange = { viewModel.confirmPassword = it },
        label = { Text("Confirm Password") },
        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
        visualTransformation = PasswordVisualTransformation(),
        // THE FIX: Using the full path to the class
        keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Password),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(8.dp))
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        OutlinedTextField(
            value = viewModel.role,
            onValueChange = {},
            readOnly = true,
            label = { Text("Select Role") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            roles.forEach { role ->
                DropdownMenuItem(
                    text = { Text(role) },
                    onClick = {
                        viewModel.role = role
                        expanded = false
                    }
                )
            }
        }
    }
}


@Composable
fun ForgotPasswordDialog(
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var email by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Reset Password") },
        text = {
            Column {
                Text("Enter your email to receive a password reset link.")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    // THE FIX: Using the full path to the class
                    keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email)
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(email) }) { Text("Send") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
