package com.sbr.sms.ui.agent.viewmodels

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.repositories.UserRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class AgentProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _agentProfile = MutableStateFlow<Agent?>(null)
    val agentProfile: StateFlow<Agent?> = _agentProfile.asStateFlow()

    init {
        observeAuthenticationState()
    }

    private fun observeAuthenticationState() {
        viewModelScope.launch {
            callbackFlow {
                val listener = FirebaseAuth.AuthStateListener { firebaseAuth -> trySend(firebaseAuth.currentUser) }
                auth.addAuthStateListener(listener)
                awaitClose { auth.removeAuthStateListener(listener) }
            }.collectLatest { firebaseUser ->
                if (firebaseUser != null) {
                    val profile = userRepository.getUser(firebaseUser.uid) as? Agent
                    _agentProfile.value = profile
                } else {
                    _agentProfile.value = null
                }
            }
        }
    }

    fun updateAvailability(isAvailable: Boolean) {
        viewModelScope.launch {
            val currentProfile = _agentProfile.value
            if (currentProfile != null) {
                try {
                    val updatedProfile = currentProfile.copy(isAvailable = isAvailable)
                    userRepository.updateAgentDetails(updatedProfile)
                } catch (e: Exception) {
                    Log.e("AgentProfileVM", "Failed to update availability", e)
                }
            }
        }
    }

    fun saveProfileChanges(
        newName: String,
        newPhone: String,
        newLocation: String,
        newSpecialization: String
    ) {
        viewModelScope.launch {
            val currentProfile = _agentProfile.value
            if (currentProfile != null) {
                try {
                    val updatedProfile = currentProfile.copy(
                        name = newName,
                        phone = newPhone,
                        location = newLocation,
                        specialization = newSpecialization
                    )
                    userRepository.updateAgentDetails(updatedProfile)
                } catch (e: Exception) {
                    Log.e("AgentProfileVM", "Failed to save profile changes", e)
                }
            }
        }
    }
}