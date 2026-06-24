package com.sbr.sms.ui.agent

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.sbr.sms.data.models.AgentLocation
import com.google.maps.android.compose.*
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng


@Composable
fun AgentLocationMap(
    location: AgentLocation,
    modifier: Modifier = Modifier
) {
    val cameraPositionState = rememberCameraPositionState {
        CameraPosition.fromLatLngZoom(
            LatLng(location.latitude, location.longitude), 15f
        )
    }

    GoogleMap(
        modifier = modifier,
        cameraPositionState = cameraPositionState
    ) {
        Marker(
            state = MarkerState(position = LatLng(location.latitude, location.longitude)),
            title = "Agent Location"
        )

    }
}
