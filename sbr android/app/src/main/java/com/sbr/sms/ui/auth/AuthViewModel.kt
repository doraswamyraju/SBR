package com.sbr.sms.ui.auth

// NEW: Add necessary imports for Compose State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.models.*
import com.sbr.sms.data.repositories.UserRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

// This sealed interface represents the definitive authentication state.
sealed interface AuthState {
    object Loading : AuthState
    data class Authenticated(val user: User) : AuthState
    object Unauthenticated : AuthState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val credentialManager: CredentialManager
) : ViewModel() {

    // UI State for the form fields
    var fullName by mutableStateOf("")
    var email by mutableStateOf("")
    var password by mutableStateOf("")
    // FIXED: Corrected the typo from "mutableState of" to "mutableStateOf"
    var confirmPassword by mutableStateOf("")
    var role by mutableStateOf("Customer")

    var snackbarMessage by mutableStateOf<String?>(null)
    var isLoading by mutableStateOf(false)

    // Observe auth session tokens and map them to UI state
    val authState: StateFlow<AuthState> = combine(
        credentialManager.savedToken,
        credentialManager.savedUserId,
        credentialManager.savedUserName,
        credentialManager.savedUserRole,
        credentialManager.savedUserPhone
    ) { token, userId, name, roleStr, phone ->
        if (token.isNullOrBlank() || userId.isBlank()) {
            AuthState.Unauthenticated
        } else {
            val roleEnum = try { UserRole.valueOf(roleStr.uppercase()) } catch (e: Exception) { UserRole.CUSTOMER }
            val tempUser: User = when (roleEnum) {
                UserRole.ADMIN -> Admin(id = userId, name = name)
                UserRole.AGENT -> Agent(id = userId, name = name, phone = phone)
                UserRole.CUSTOMER -> Customer(id = userId, name = name, phone = phone)
            }
            AuthState.Authenticated(tempUser)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AuthState.Loading)

    val savedEmail: StateFlow<String> = credentialManager.savedEmail
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    fun loginUser() {
        if (email.isBlank() || password.isBlank()) {
            snackbarMessage = "Email and password cannot be empty."
            return
        }
        isLoading = true
        viewModelScope.launch {
            try {
                val user = userRepository.login(email, password)
                if (user == null) {
                    snackbarMessage = "Login failed. Invalid email or password."
                }
            } catch (e: Exception) {
                snackbarMessage = e.message ?: "Login failed."
            } finally {
                isLoading = false
            }
        }
    }

    fun signupUser() {
        if (password != confirmPassword) {
            snackbarMessage = "Passwords do not match."
            return
        }
        isLoading = true
        viewModelScope.launch {
            try {
                val user = userRepository.signup(fullName, email, password, role.uppercase())
                if (user == null) {
                    snackbarMessage = "Sign up failed."
                }
            } catch (e: Exception) {
                snackbarMessage = e.message ?: "Sign up failed."
            } finally {
                isLoading = false
            }
        }
    }

    fun sendPasswordReset(email: String) {
        snackbarMessage = "Password reset feature is not configured for email on the self-hosted backend. Please contact Sri Balaji Renewables Admin."
    }

    fun logout() {
        viewModelScope.launch {
            userRepository.logout()
        }
    }
}