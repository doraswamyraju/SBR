package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

@HiltViewModel
class CustomerSelectionViewModel @Inject constructor(
    userRepository: UserRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // This flow will get all customers and filter them based on the search query
    val filteredCustomers: StateFlow<List<Customer>> = userRepository.getAllUsersFlow()
        .map { users -> users.filterIsInstance<Customer>() }
        .combine(_searchQuery) { customers, query ->
            if (query.isBlank()) {
                customers
            } else {
                customers.filter {
                    it.name.contains(query, ignoreCase = true) ||
                            it.phone?.contains(query, ignoreCase = true) == true
                }
            }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }
}