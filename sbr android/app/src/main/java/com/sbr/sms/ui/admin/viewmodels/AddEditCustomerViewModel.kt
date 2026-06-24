package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

sealed interface AddCustomerUiState {
    object Idle : AddCustomerUiState
    object Loading : AddCustomerUiState
    data class Success(val newCustomerId: String?) : AddCustomerUiState
    data class Error(val message: String) : AddCustomerUiState
}

@HiltViewModel
class AddEditCustomerViewModel @Inject constructor(
    private val userRepository: UserRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<AddCustomerUiState>(AddCustomerUiState.Idle)
    val uiState: StateFlow<AddCustomerUiState> = _uiState

    private val _name = MutableStateFlow("")
    val name: StateFlow<String> = _name.asStateFlow()

    private val _phone = MutableStateFlow("")
    val phone: StateFlow<String> = _phone.asStateFlow()

    private val _address = MutableStateFlow("")
    val address: StateFlow<String> = _address.asStateFlow()

    // NEW: State for the recurring service checkbox.
    private val _isRecurring = MutableStateFlow(false)
    val isRecurring: StateFlow<Boolean> = _isRecurring.asStateFlow()

    private val customerId: String? = savedStateHandle["customerId"]
    val isEditMode = customerId != null

    init {
        if (isEditMode) {
            loadCustomerData()
        }
    }

    private fun loadCustomerData() {
        viewModelScope.launch {
            val customer = userRepository.getUser(customerId!!) as? Customer
            customer?.let {
                _name.value = it.name
                _phone.value = it.phone ?: ""
                _address.value = it.address ?: ""
                // NEW: Load the customer's current recurring status.
                _isRecurring.value = it.isRecurring
            }
        }
    }

    fun onNameChange(newName: String) { _name.value = newName }
    fun onPhoneChange(newPhone: String) { _phone.value = newPhone }
    fun onAddressChange(newAddress: String) { _address.value = newAddress }
    // NEW: Function to handle checkbox state change.
    fun onRecurringChange(isChecked: Boolean) { _isRecurring.value = isChecked }

    fun saveOrUpdateCustomer() {
        val currentName = _name.value
        val currentPhone = _phone.value
        val currentAddress = _address.value

        if (currentName.isBlank() || currentPhone.isBlank() || currentAddress.isBlank()) {
            _uiState.value = AddCustomerUiState.Error("All fields are required.")
            return
        }

        viewModelScope.launch {
            _uiState.value = AddCustomerUiState.Loading
            try {
                val customerData = Customer(
                    id = customerId ?: UUID.randomUUID().toString(),
                    name = currentName,
                    phone = currentPhone,
                    address = currentAddress,
                    // NEW: Include the recurring status when saving.
                    isRecurring = _isRecurring.value
                )

                if (isEditMode) {
                    userRepository.updateCustomer(customerData)
                    _uiState.value = AddCustomerUiState.Success(null)
                } else {
                    userRepository.createUser(customerData)
                    _uiState.value = AddCustomerUiState.Success(customerData.id)
                }
            } catch (e: Exception) {
                _uiState.value = AddCustomerUiState.Error(e.message ?: "Failed to save customer.")
            }
        }
    }
}