package com.sbr.sms.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.CustomerRecordDto
import com.sbr.sms.data.repositories.CustomerListRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CustomerListViewModel @Inject constructor(
    private val repository: CustomerListRepository
) : ViewModel() {

    private val _customers = MutableStateFlow<List<CustomerRecordDto>>(emptyList())
    val customers: StateFlow<List<CustomerRecordDto>> = _customers.asStateFlow()

    private val _availableProducts = MutableStateFlow<List<String>>(emptyList())
    val availableProducts: StateFlow<List<String>> = _availableProducts.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedProduct = MutableStateFlow("All")
    val selectedProduct: StateFlow<String> = _selectedProduct.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        fetchCustomers()
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        fetchCustomers()
    }

    fun setSelectedProduct(product: String) {
        _selectedProduct.value = product
        fetchCustomers()
    }

    fun fetchCustomers() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            val result = repository.getCustomerList(
                search = _searchQuery.value.takeIf { it.isNotBlank() },
                product = _selectedProduct.value.takeIf { it != "All" }
            )

            result.onSuccess { response ->
                _customers.value = response.data ?: emptyList()
                _availableProducts.value = response.products ?: emptyList()
            }.onFailure { error ->
                _errorMessage.value = error.localizedMessage
            }
            _isLoading.value = false
        }
    }

    fun addCustomerRecord(record: CustomerRecordDto, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = repository.addCustomerRecord(record)
            result.onSuccess {
                fetchCustomers()
                onSuccess()
            }.onFailure { error ->
                _errorMessage.value = error.localizedMessage
            }
            _isLoading.value = false
        }
    }

    fun deleteCustomerRecord(id: String) {
        viewModelScope.launch {
            val result = repository.deleteCustomerRecord(id)
            result.onSuccess {
                fetchCustomers()
            }.onFailure { error ->
                _errorMessage.value = error.localizedMessage
            }
        }
    }

    fun clearCustomerList() {
        viewModelScope.launch {
            _isLoading.value = true
            val result = repository.clearCustomerList()
            result.onSuccess {
                fetchCustomers()
            }.onFailure { error ->
                _errorMessage.value = error.localizedMessage
            }
            _isLoading.value = false
        }
    }
}
