package com.sbr.sms.ui.common

/**
 * A generic sealed interface to represent the state of a UI component
 * that loads data. This is the single source of truth for all UI states.
 */
sealed interface UiState<out T> {
    object Idle : UiState<Nothing>
    object Loading : UiState<Nothing>
    data class Success<out T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
    object Empty : UiState<Nothing>
}