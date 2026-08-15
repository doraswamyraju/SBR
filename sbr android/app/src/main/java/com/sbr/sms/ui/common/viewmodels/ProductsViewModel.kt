package com.sbr.sms.ui.common.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ProductDto
import com.sbr.sms.data.api.ProductRequest
import com.sbr.sms.data.repositories.ProductsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductsUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val products: List<ProductDto> = emptyList(),
    val selectedCategory: String = "All",
    val searchQuery: String = "",
    val isSubmitting: Boolean = false
)

@HiltViewModel
class ProductsViewModel @Inject constructor(
    private val repository: ProductsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProductsUiState())
    val uiState: StateFlow<ProductsUiState> = _uiState.asStateFlow()

    init {
        loadProducts()
    }

    fun loadProducts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = repository.getProducts(
                activeOnly = false,
                category = _uiState.value.selectedCategory
            )
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        products = result.getOrDefault(emptyList())
                    )
                }
            } else {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to load products"
                    )
                }
            }
        }
    }

    fun setCategory(category: String) {
        _uiState.update { it.copy(selectedCategory = category) }
        loadProducts()
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun createProduct(productReq: ProductRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, successMessage = null) }
            val result = repository.createProduct(productReq)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        successMessage = "Product created successfully!"
                    )
                }
                loadProducts()
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to create product"
                    )
                }
            }
        }
    }

    fun updateProduct(id: String, productReq: ProductRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, successMessage = null) }
            val result = repository.updateProduct(id, productReq)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        successMessage = "Product updated successfully!"
                    )
                }
                loadProducts()
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to update product"
                    )
                }
            }
        }
    }

    fun deleteProduct(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null, successMessage = null) }
            val result = repository.deleteProduct(id)
            if (result.isSuccess) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        successMessage = "Product deleted successfully!"
                    )
                }
                loadProducts()
            } else {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        error = result.exceptionOrNull()?.message ?: "Failed to delete product"
                    )
                }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMessage = null) }
    }
}
