package com.sbr.sms.data.api

import com.sbr.sms.data.CredentialManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val credentialManager: CredentialManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Retrieve token synchronously from DataStore using runBlocking
        val token = runBlocking {
            credentialManager.savedToken.first()
        }

        val requestBuilder = originalRequest.newBuilder()
        
        if (!token.isNullOrBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }

        return chain.proceed(requestBuilder.build())
    }
}
