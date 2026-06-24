// Create a new file in /ui/admin/viewmodels/
package com.sbr.sms.ui.admin.viewmodels

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddAgentViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    var name by mutableStateOf("")
    var email by mutableStateOf("")
    var phone by mutableStateOf("")
    var location by mutableStateOf("")
    var password by mutableStateOf("")

    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var isSuccess by mutableStateOf(false)

    fun addAgent() {
        if (name.isBlank() || email.isBlank() || phone.isBlank() || location.isBlank() || password.isBlank()) {
            errorMessage = "All fields are required."
            return
        }
        isLoading = true
        errorMessage = null

        viewModelScope.launch {
            try {
                // Step 1: Create the agent user in backend database via the REST signup API
                val user = userRepository.signup(name, email, password, "AGENT")
                    ?: throw Exception("Failed to register agent account.")

                // Step 2: Create the Agent object
                val newAgent = Agent(
                    id = user.id,
                    name = name,
                    email = email,
                    phone = phone,
                    location = location,
                    status = "Active", // Default status
                    isAvailable = true,
                    rating = 0.0f,
                    completedJobs = 0
                )

                // Step 3: Update agent details in backend database
                userRepository.updateAgentDetails(newAgent)

                isSuccess = true

            } catch (e: Exception) {
                errorMessage = e.message ?: "An unknown error occurred."
            } finally {
                isLoading = false
            }
        }
    }
}