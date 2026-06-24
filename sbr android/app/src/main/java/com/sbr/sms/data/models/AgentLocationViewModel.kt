// File: AgentLocationViewModel.kt
package com.sbr.sms.ui.common.viewmodels

import androidx.lifecycle.ViewModel
import com.google.android.gms.maps.model.LatLng
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class AgentLocationViewModel @Inject constructor() : ViewModel() {
    private val _locations = MutableStateFlow<Map<String, LatLng>>(emptyMap())
    val locations: StateFlow<Map<String, LatLng>> = _locations

    fun updateAgentLocation(agentId: String, lat: Double, lng: Double) {
        _locations.value = _locations.value.toMutableMap().apply {
            put(agentId, LatLng(lat, lng))
        }
    }
}
