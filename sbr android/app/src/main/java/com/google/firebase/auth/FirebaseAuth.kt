package com.google.firebase.auth

import com.sbr.sms.data.CredentialManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

class FirebaseUser(val uid: String)

@Singleton
class FirebaseAuth @Inject constructor(
    private val credentialManager: CredentialManager
) {
    private val scope = CoroutineScope(Dispatchers.Main)
    private val listeners = mutableListOf<AuthStateListener>()

    init {
        // Collect saved token changes to notify any active auth state listeners
        scope.launch {
            credentialManager.savedToken.collectLatest {
                notifyListeners()
            }
        }
    }

    val currentUser: FirebaseUser?
        get() {
            val uid = runBlocking { credentialManager.savedUserId.first() }
            return if (uid.isNotBlank()) FirebaseUser(uid) else null
        }

    fun signOut() {
        runBlocking {
            credentialManager.clearAuthSession()
        }
    }

    interface AuthStateListener {
        fun onAuthStateChanged(auth: FirebaseAuth)
    }

    fun addAuthStateListener(listener: AuthStateListener) {
        listeners.add(listener)
        listener.onAuthStateChanged(this)
    }

    fun removeAuthStateListener(listener: AuthStateListener) {
        listeners.remove(listener)
    }

    private fun notifyListeners() {
        listeners.forEach { it.onAuthStateChanged(this) }
    }

    companion object {
        fun getInstance(): FirebaseAuth {
            throw UnsupportedOperationException("FirebaseAuth must be injected via Hilt dependency injection.")
        }
    }
}
