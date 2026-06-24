package com.sbr.sms.ui.agent.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.repositories.UserRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SetupNavigationEvent {
    object NavigateToAgentPanel : SetupNavigationEvent()
}

@HiltViewModel
class AgentProfileSetupViewModel @Inject constructor(
    private val auth: FirebaseAuth,
    private val userRepository: UserRepository
) : ViewModel() {

    // Form state
    var phone by mutableStateOf("")
    var location by mutableStateOf("")

    // UI state
    var errorMessage by mutableStateOf<String?>(null)
    var isLoading by mutableStateOf(false)

    private val _navigationEvent = MutableSharedFlow<SetupNavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()

    fun onSaveProfileClicked() {
        if (phone.isBlank() || location.isBlank()) {
            errorMessage = "All fields are required."
            return
        }
        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            try {
                val currentUser = auth.currentUser ?: throw IllegalStateException("User not logged in.")
                val initialUser = userRepository.getUser(currentUser.uid)
                    ?: throw IllegalStateException("Initial user data not found.")

                // Create the complete Agent object with all required fields
                val completeAgentProfile = Agent(
                    id = currentUser.uid,
                    name = initialUser.name,
                    email = initialUser.email,
                    phone = phone,
                    location = location,
                    // Set default values for the agent's profile
                    status = "Active",
                    isAvailable = true,
                    rating = 5.0f,
                    completedJobs = 0,
                    currentLat = null, // Can be fetched here if needed
                    currentLng = null
                )

                // Use the repository to save the complete profile
                userRepository.updateAgentDetails(completeAgentProfile)

                // Navigate to the main agent panel on success
                _navigationEvent.emit(SetupNavigationEvent.NavigateToAgentPanel)

            } catch (e: Exception) {
                errorMessage = e.message ?: "Failed to save profile."
            } finally {
                isLoading = false
            }
        }
    }
}