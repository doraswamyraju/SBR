package com.sbr.sms.ui.customer.viewmodels

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.repositories.StorageRepository
import com.sbr.sms.data.repositories.UserRepository
import com.sbr.sms.ui.common.UiState
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileData(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    val photoUrl: String? = null,
    val photoUri: Uri? = null,
)

sealed interface ProfileScreenState {
    object Loading : ProfileScreenState
    data class Success(
        val user: ProfileData,
        val isSaving: Boolean = false,
        val canBeSaved: Boolean = false
    ) : ProfileScreenState
    data class Error(val message: String) : ProfileScreenState
}

@HiltViewModel
class CustomerProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val storageRepository: StorageRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileScreenState>(ProfileScreenState.Loading)
    val uiState: StateFlow<ProfileScreenState> = _uiState.asStateFlow()

    private val _saveStatus = MutableSharedFlow<UiState<Unit>>()
    val saveStatus = _saveStatus.asSharedFlow()

    private var originalUser: ProfileData? = null

    init {
        loadUserProfile()
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            _uiState.value = ProfileScreenState.Loading
            val userId = auth.currentUser?.uid
            if (userId == null) {
                _uiState.value = ProfileScreenState.Error("User not logged in.")
                return@launch
            }
            try {
                val user = userRepository.getUser(userId) as? Customer
                if (user != null) {
                    val profileData = ProfileData(
                        id = user.id,
                        name = user.name,
                        email = user.email ?: "No email",
                        phone = user.phone ?: "",
                        address = user.address ?: "",
                        photoUrl = user.photoUrl
                    )
                    originalUser = profileData
                    _uiState.value = ProfileScreenState.Success(profileData)
                } else {
                    _uiState.value = ProfileScreenState.Error("Could not load user profile.")
                }
            } catch (e: Exception) {
                _uiState.value = ProfileScreenState.Error(e.message ?: "An unknown error occurred.")
            }
        }
    }

    fun onNameChanged(name: String) {
        updateState { it.copy(name = name) }
    }

    fun onPhoneChanged(phone: String) {
        updateState { it.copy(phone = phone) }
    }

    fun onAddressChanged(address: String) {
        updateState { it.copy(address = address) }
    }

    fun onPhotoUriChanged(uri: Uri) {
        updateState { it.copy(photoUri = uri) }
    }

    private fun updateState(updateAction: (ProfileData) -> ProfileData) {
        _uiState.update {
            if (it is ProfileScreenState.Success) {
                val updatedUser = updateAction(it.user)
                it.copy(
                    user = updatedUser,
                    canBeSaved = updatedUser != originalUser
                )
            } else {
                it
            }
        }
    }

    fun saveProfile() {
        val currentState = _uiState.value
        if (currentState !is ProfileScreenState.Success || !currentState.canBeSaved) return

        viewModelScope.launch {
            _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = true) }

            try {
                var newPhotoUrl = currentState.user.photoUrl
                if (currentState.user.photoUri != null) {
                    newPhotoUrl = storageRepository.uploadProfileImage(currentState.user.id, currentState.user.photoUri!!)
                }

                // FIX: The Customer object is now created with the correct parameters.
                val updatedCustomer = Customer(
                    id = currentState.user.id,
                    name = currentState.user.name,
                    email = currentState.user.email,
                    phone = currentState.user.phone,
                    address = currentState.user.address,
                    photoUrl = newPhotoUrl
                )
                userRepository.createUser(updatedCustomer)

                originalUser = currentState.user.copy(photoUrl = newPhotoUrl, photoUri = null)

                _uiState.update {
                    (it as ProfileScreenState.Success).copy(
                        user = originalUser!!,
                        isSaving = false,
                        canBeSaved = false
                    )
                }
                _saveStatus.emit(UiState.Success(Unit))
            } catch (e: Exception) {
                _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = false) }
                _saveStatus.emit(UiState.Error(e.message ?: "Failed to save."))
            }
        }
    }
}