package com.sbr.sms.data.socket

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.URI
import javax.inject.Inject
import javax.inject.Singleton

data class AgentLocationUpdate(
    val requestId: String,
    val agentId: String,
    val latitude: Double,
    val longitude: Double,
    val heading: Float = 0f,
    val speed: Float = 0f,
    val timestamp: Long = System.currentTimeMillis()
)

data class RequestStatusUpdate(
    val requestId: String,
    val status: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Singleton
class SocketManager @Inject constructor() {

    private val tag = "SocketManager"
    private val socketUrl = "https://sbr.sriddha.com"

    private var socket: Socket? = null

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _locationUpdates = MutableSharedFlow<AgentLocationUpdate>(extraBufferCapacity = 64)
    val locationUpdates: SharedFlow<AgentLocationUpdate> = _locationUpdates.asSharedFlow()

    private val _statusUpdates = MutableSharedFlow<RequestStatusUpdate>(extraBufferCapacity = 64)
    val statusUpdates: SharedFlow<RequestStatusUpdate> = _statusUpdates.asSharedFlow()

    private val scope = CoroutineScope(Dispatchers.IO)

    @Synchronized
    fun connect() {
        if (socket?.connected() == true) return

        try {
            if (socket == null) {
                val options = IO.Options().apply {
                    transports = arrayOf("websocket", "polling")
                    reconnection = true
                    reconnectionAttempts = Int.MAX_VALUE
                    reconnectionDelay = 1000
                    timeout = 10000
                }
                socket = IO.socket(URI.create(socketUrl), options)

                socket?.on(Socket.EVENT_CONNECT) {
                    Log.d(tag, "Socket connected to $socketUrl")
                    _isConnected.value = true
                }

                socket?.on(Socket.EVENT_DISCONNECT) {
                    Log.d(tag, "Socket disconnected")
                    _isConnected.value = false
                }

                socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e(tag, "Socket connect error: ${args.firstOrNull()}")
                    _isConnected.value = false
                }

                // Listen for agent location broadcast
                socket?.on("agent:location:update") { args ->
                    val data = args.firstOrNull() as? JSONObject ?: return@on
                    try {
                        val update = AgentLocationUpdate(
                            requestId = data.optString("requestId", ""),
                            agentId = data.optString("agentId", ""),
                            latitude = data.optDouble("latitude", 0.0),
                            longitude = data.optDouble("longitude", 0.0),
                            heading = data.optDouble("heading", 0.0).toFloat(),
                            speed = data.optDouble("speed", 0.0).toFloat(),
                            timestamp = data.optLong("timestamp", System.currentTimeMillis())
                        )
                        scope.launch {
                            _locationUpdates.emit(update)
                        }
                    } catch (e: Exception) {
                        Log.e(tag, "Error parsing agent:location:update", e)
                    }
                }

                // Listen for request status updates
                socket?.on("request:status:update") { args ->
                    val data = args.firstOrNull() as? JSONObject ?: return@on
                    try {
                        val update = RequestStatusUpdate(
                            requestId = data.optString("requestId", ""),
                            status = data.optString("status", ""),
                            timestamp = data.optLong("timestamp", System.currentTimeMillis())
                        )
                        scope.launch {
                            _statusUpdates.emit(update)
                        }
                    } catch (e: Exception) {
                        Log.e(tag, "Error parsing request:status:update", e)
                    }
                }
            }

            socket?.connect()
        } catch (e: Exception) {
            Log.e(tag, "Failed to initialize socket", e)
        }
    }

    fun disconnect() {
        try {
            socket?.disconnect()
            _isConnected.value = false
        } catch (e: Exception) {
            Log.e(tag, "Error disconnecting socket", e)
        }
    }

    fun joinRequestRoom(requestId: String) {
        connect()
        val data = JSONObject().apply {
            put("room", "request:$requestId")
            put("requestId", requestId)
        }
        socket?.emit("join:request", data)
        Log.d(tag, "Emitted join:request for room request:$requestId")
    }

    fun leaveRequestRoom(requestId: String) {
        val data = JSONObject().apply {
            put("room", "request:$requestId")
            put("requestId", requestId)
        }
        socket?.emit("leave:request", data)
        Log.d(tag, "Emitted leave:request for room request:$requestId")
    }

    fun joinAgentRoom(agentId: String) {
        connect()
        val data = JSONObject().apply {
            put("room", "agent:$agentId")
            put("agentId", agentId)
        }
        socket?.emit("join:agent", data)
        Log.d(tag, "Emitted join:agent for room agent:$agentId")
    }

    fun sendAgentLocation(
        requestId: String,
        agentId: String,
        latitude: Double,
        longitude: Double,
        heading: Float = 0f,
        speed: Float = 0f
    ) {
        connect()
        val payload = JSONObject().apply {
            put("requestId", requestId)
            put("agentId", agentId)
            put("latitude", latitude)
            put("longitude", longitude)
            put("heading", heading)
            put("speed", speed)
            put("timestamp", System.currentTimeMillis())
        }
        socket?.emit("agent:location:send", payload)
        Log.d(tag, "Emitted agent:location:send -> ($latitude, $longitude)")
    }
}
