package com.sbr.sms.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

// Creates a DataStore instance, available to the whole app
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "credentials")

@Singleton
class CredentialManager @Inject constructor(@ApplicationContext context: Context) {

    private val credentialDataStore = context.dataStore

    // Defines the keys we'll use to store credentials
    companion object {
        private val KEY_EMAIL = stringPreferencesKey("saved_email")
        private val KEY_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_USER_ROLE = stringPreferencesKey("user_role")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
    }

    // Flows to observe saved credentials
    val savedEmail = credentialDataStore.data.map { preferences ->
        preferences[KEY_EMAIL] ?: ""
    }

    val savedToken = credentialDataStore.data.map { preferences ->
        preferences[KEY_TOKEN]
    }

    val savedUserId = credentialDataStore.data.map { preferences ->
        preferences[KEY_USER_ID] ?: ""
    }

    val savedUserRole = credentialDataStore.data.map { preferences ->
        preferences[KEY_USER_ROLE] ?: ""
    }

    val savedUserName = credentialDataStore.data.map { preferences ->
        preferences[KEY_USER_NAME] ?: ""
    }

    // Save functions
    suspend fun saveEmail(email: String) {
        credentialDataStore.edit { preferences ->
            preferences[KEY_EMAIL] = email
        }
    }

    suspend fun saveAuthSession(token: String, userId: String, name: String, role: String, email: String) {
        credentialDataStore.edit { preferences ->
            preferences[KEY_TOKEN] = token
            preferences[KEY_USER_ID] = userId
            preferences[KEY_USER_NAME] = name
            preferences[KEY_USER_ROLE] = role
            preferences[KEY_EMAIL] = email
        }
    }

    suspend fun clearAuthSession() {
        credentialDataStore.edit { preferences ->
            preferences.remove(KEY_TOKEN)
            preferences.remove(KEY_USER_ID)
            preferences.remove(KEY_USER_NAME)
            preferences.remove(KEY_USER_ROLE)
        }
    }
}