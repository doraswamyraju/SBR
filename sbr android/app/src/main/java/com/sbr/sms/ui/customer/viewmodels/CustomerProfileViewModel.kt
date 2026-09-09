package com.sbr.sms.ui.customer.viewmodels

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.UserAddress
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
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileData(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val address: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val addresses: List<UserAddress> = emptyList(),
    val photoUrl: String? = null,
    val photoUri: Uri? = null,
)

sealed interface ProfileScreenState {
    object Loading : ProfileScreenState
    data class Success(
        val user: ProfileData,
        val isSaving: Boolean = false,
        val canBeSaved: Boolean = false,
        val isDeleting: Boolean = false
    ) : ProfileScreenState
    data class Error(val message: String) : ProfileScreenState
}

@HiltViewModel
class CustomerProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val storageRepository: StorageRepository,
    private val credentialManager: CredentialManager,
    private val auth: FirebaseAuth
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProfileScreenState>(ProfileScreenState.Loading)
    val uiState: StateFlow<ProfileScreenState> = _uiState.asStateFlow()

    private val _saveStatus = MutableSharedFlow<UiState<String>>()
    val saveStatus = _saveStatus.asSharedFlow()

    private var originalUser: ProfileData? = null

    init {
        loadUserProfile()
    }

    fun loadUserProfile() {
        viewModelScope.launch {
            _uiState.value = ProfileScreenState.Loading
            val savedId = credentialManager.savedUserId.first()
            val userId = if (savedId.isNotBlank()) savedId else auth.currentUser?.uid
            if (userId.isNullOrBlank()) {
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
                        latitude = user.latitude,
                        longitude = user.longitude,
                        addresses = user.addresses,
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

    fun onLatitudeLongitudeChanged(lat: Double, lng: Double) {
        updateState { it.copy(latitude = lat, longitude = lng) }
    }

    fun onPhotoUriChanged(uri: Uri) {
        updateState { it.copy(photoUri = uri) }
        // Upload immediately in background or queue for save
        uploadProfileImage(uri)
    }

    private fun uploadProfileImage(uri: Uri) {
        val currentState = _uiState.value
        if (currentState !is ProfileScreenState.Success) return

        viewModelScope.launch {
            _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = true) }
            try {
                val newPhotoUrl = storageRepository.uploadProfileImage(currentState.user.id, uri)
                updateState { it.copy(photoUrl = newPhotoUrl, photoUri = null) }
                _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = false) }
                _saveStatus.emit(UiState.Success("Photo uploaded. Save profile to finalize."))
            } catch (e: Exception) {
                _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = false) }
                _saveStatus.emit(UiState.Error(e.message ?: "Failed to upload photo."))
            }
        }
    }

    fun onAddAddress(address: UserAddress) {
        updateState { current ->
            val updatedList = current.addresses + address
            current.copy(addresses = updatedList)
        }
        saveProfileDirect()
    }

    fun onUpdateAddress(address: UserAddress) {
        updateState { current ->
            val updatedList = current.addresses.map {
                if (it.id == address.id) address else it
            }
            current.copy(addresses = updatedList)
        }
        saveProfileDirect()
    }

    fun onDeleteAddress(addressId: String) {
        updateState { current ->
            val updatedList = current.addresses.filterNot { it.id == addressId }
            current.copy(addresses = updatedList)
        }
        saveProfileDirect()
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
                    newPhotoUrl = storageRepository.uploadProfileImage(currentState.user.id, currentState.user.photoUri)
                }

                val updatedCustomer = Customer(
                    id = currentState.user.id,
                    name = currentState.user.name.trim(),
                    email = currentState.user.email,
                    phone = currentState.user.phone.trim(),
                    address = currentState.user.address.trim(),
                    latitude = currentState.user.latitude,
                    longitude = currentState.user.longitude,
                    addresses = currentState.user.addresses,
                    photoUrl = newPhotoUrl
                )
                userRepository.updateCustomer(updatedCustomer)

                originalUser = currentState.user.copy(photoUrl = newPhotoUrl, photoUri = null)

                _uiState.update {
                    (it as ProfileScreenState.Success).copy(
                        user = originalUser!!,
                        isSaving = false,
                        canBeSaved = false
                    )
                }
                _saveStatus.emit(UiState.Success("Profile saved successfully!"))
            } catch (e: Exception) {
                _uiState.update { (it as ProfileScreenState.Success).copy(isSaving = false) }
                _saveStatus.emit(UiState.Error(e.message ?: "Failed to save profile."))
            }
        }
    }

    private fun saveProfileDirect() {
        val currentState = _uiState.value
        if (currentState !is ProfileScreenState.Success) return

        viewModelScope.launch {
            try {
                val updatedCustomer = Customer(
                    id = currentState.user.id,
                    name = currentState.user.name.trim(),
                    email = currentState.user.email,
                    phone = currentState.user.phone.trim(),
                    address = currentState.user.address.trim(),
                    latitude = currentState.user.latitude,
                    longitude = currentState.user.longitude,
                    addresses = currentState.user.addresses,
                    photoUrl = currentState.user.photoUrl
                )
                userRepository.updateCustomer(updatedCustomer)
                originalUser = currentState.user.copy()
                _uiState.update {
                    (it as ProfileScreenState.Success).copy(
                        user = originalUser!!,
                        canBeSaved = false
                    )
                }
            } catch (e: Exception) {
                _saveStatus.emit(UiState.Error(e.message ?: "Failed to update address list."))
            }
        }
    }

    fun deleteAccount(onComplete: () -> Unit) {
        val currentState = _uiState.value
        if (currentState !is ProfileScreenState.Success) return

        viewModelScope.launch {
            _uiState.update { (it as ProfileScreenState.Success).copy(isDeleting = true) }
            try {
                val success = userRepository.deleteProfile()
                if (success) {
                    onComplete()
                } else {
                    _uiState.update { (it as ProfileScreenState.Success).copy(isDeleting = false) }
                    _saveStatus.emit(UiState.Error("Failed to delete account. Please try again."))
                }
            } catch (e: Exception) {
                _uiState.update { (it as ProfileScreenState.Success).copy(isDeleting = false) }
                _saveStatus.emit(UiState.Error(e.message ?: "An error occurred during account deletion."))
            }
        }
    }
}